CREATE DATABASE LineageStore;
GO

USE LineageStore;
GO

CREATE TABLE dbo.lineage_map (
    id INT IDENTITY(1,1) PRIMARY KEY,
    procedure_name NVARCHAR(255) NOT NULL,
    database_name NVARCHAR(100) NOT NULL,
    schema_name NVARCHAR(100) NOT NULL,
    source_table NVARCHAR(255) NOT NULL,
    target_table NVARCHAR(255) NOT NULL,
    source_column NVARCHAR(255) NOT NULL,
    target_column NVARCHAR(255) NOT NULL,
    source_full NVARCHAR(500) NOT NULL,
    analyzed_at DATETIME NOT NULL,
    hash CHAR(64) NOT NULL  -- SHA-256 hash
);
GO

-- Speed up filtering by procedure or schema
CREATE INDEX IX_lineage_map_proc ON dbo.lineage_map(procedure_name);
CREATE INDEX IX_lineage_map_schema ON dbo.lineage_map(schema_name);
CREATE INDEX IX_lineage_map_hash ON dbo.lineage_map(hash);

USE LineageStore;
GO

CREATE VIEW dbo.vw_lineage_summary AS
SELECT
    procedure_name,
    database_name,
    schema_name,
    source_full AS source_table_full,
    CONCAT(target_table, '.', target_column) AS target_column_full,
    source_column,
    target_column,
    analyzed_at,
    hash
FROM dbo.lineage_map;
GO

CREATE VIEW dbo.vw_lineage_summary_aggregated AS
SELECT
    procedure_name,
    database_name,
    schema_name,
    source_full AS source_table,
    target_table,
    STRING_AGG(CONCAT(source_column, ' → ', target_column), ', ') AS column_mappings,
    MAX(analyzed_at) AS last_analyzed,
    MAX(hash) AS last_hash
FROM dbo.lineage_map
GROUP BY
    procedure_name,
    database_name,
    schema_name,
    source_full,
    target_table;
GO

USE LineageStore;
GO

CREATE OR ALTER VIEW dbo.vw_table_lineage_stage_map AS
WITH mapped_tables AS (
    SELECT
        procedure_name,
        source_full AS source_table_full,
        source_table AS source_table_name,
        target_table AS target_table_name,
        schema_name AS target_schema,
        database_name AS target_stage,

        -- Decompose full source table
        PARSENAME(REPLACE(source_full, '[', ''), 1) AS source_table,
        PARSENAME(REPLACE(source_full, '[', ''), 2) AS source_schema,
        PARSENAME(REPLACE(source_full, '[', ''), 3) AS source_database
    FROM dbo.lineage_map
    GROUP BY
        procedure_name, source_full, source_table, target_table, schema_name, database_name
)
SELECT
    MAX(CASE WHEN target_stage = 'Bronze' THEN source_database END) AS bronze_database,
    MAX(CASE WHEN target_stage = 'Bronze' THEN source_schema END)   AS bronze_schema,
    MAX(CASE WHEN target_stage = 'Bronze' THEN source_table END)    AS bronze_table,

    MAX(CASE WHEN target_stage = 'Silver' THEN source_database END) AS silver_database,
    MAX(CASE WHEN target_stage = 'Silver' THEN source_schema END)   AS silver_schema,
    MAX(CASE WHEN target_stage = 'Silver' THEN source_table END)    AS silver_table,

    MAX(CASE WHEN target_stage = 'Gold' THEN source_database END)   AS gold_database,
    MAX(CASE WHEN target_stage = 'Gold' THEN source_schema END)     AS gold_schema,
    MAX(CASE WHEN target_stage = 'Gold' THEN source_table END)      AS gold_table
FROM mapped_tables
GROUP BY source_table_full;
GO

CREATE TABLE dbo.source_to_stage_map (
    source_type       NVARCHAR(50),   -- e.g., SQLServer, Oracle, API
    source_host       NVARCHAR(255),
    source_tns        NVARCHAR(255),  -- for Oracle, optional
    source_database   NVARCHAR(128),
    source_schema     NVARCHAR(128),
    source_table      NVARCHAR(128),
    
    stage_database    NVARCHAR(128),
    stage_schema      NVARCHAR(128),
    stage_table       NVARCHAR(128),

    connection_name   NVARCHAR(128),  -- optional friendly name or alias
    notes             NVARCHAR(MAX),  -- optional

    created_at        DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.stage_to_bronze_map (
    stage_database     NVARCHAR(128) NOT NULL,
    stage_schema       NVARCHAR(128) NOT NULL,
    stage_table        NVARCHAR(128) NOT NULL,
    bronze_database    NVARCHAR(128) NOT NULL,
    bronze_schema      NVARCHAR(128) NOT NULL,
    bronze_table       NVARCHAR(128) NOT NULL,
    created_at         DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- Optional index to help with joins/lookup
CREATE INDEX IX_stage_to_bronze_map_lookup
ON dbo.stage_to_bronze_map (stage_database, stage_schema, stage_table);

CREATE TABLE dbo.source_to_stage_map (
    source_type       NVARCHAR(50),   -- e.g., SQLServer, Oracle, API
    source_host       NVARCHAR(255),
    source_tns        NVARCHAR(255),  -- for Oracle, optional
    source_database   NVARCHAR(128),
    source_schema     NVARCHAR(128),
    source_table      NVARCHAR(128),
    
    stage_database    NVARCHAR(128),
    stage_schema      NVARCHAR(128),
    stage_table       NVARCHAR(128),

    connection_name   NVARCHAR(128),  -- optional friendly name or alias
    notes             NVARCHAR(MAX),  -- optional

    created_at        DATETIME2 DEFAULT SYSUTCDATETIME()
);