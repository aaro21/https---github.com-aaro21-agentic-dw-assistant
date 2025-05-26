USE master;
GO
CREATE DATABASE ai_assistant;
GO

USE ai_assistant;
GO

CREATE TABLE procedure_analysis_cache (
    id INT IDENTITY(1,1) PRIMARY KEY,
    db_alias NVARCHAR(100) NOT NULL,
    procedure_name NVARCHAR(200) NOT NULL,
    proc_hash CHAR(64) NOT NULL,  -- SHA256
    summary NVARCHAR(MAX) NOT NULL,
    analyzed_at DATETIME2 DEFAULT SYSDATETIME()
);

-- Optional index for fast lookup
CREATE INDEX idx_proc_cache_lookup
    ON procedure_analysis_cache (db_alias, procedure_name, proc_hash);