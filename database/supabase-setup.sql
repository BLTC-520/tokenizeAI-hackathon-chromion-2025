CREATE TABLE skill_market_data (
    id SERIAL PRIMARY KEY,
    skill VARCHAR(100) NOT NULL UNIQUE,
    average_hourly_rate DECIMAL(10,2) NOT NULL,  -- Average hourly rate, e.g. 75.50
    demand_level INTEGER NOT NULL CHECK (demand_level >= 1 AND demand_level <= 100),  -- Demand level from 1 to 100
    project_volume INTEGER NOT NULL DEFAULT 0,   -- Number of projects
    competition_level INTEGER NOT NULL CHECK (competition_level >= 1 AND competition_level <= 10),  -- Competition level from 1 to 10
    market_trend VARCHAR(20) DEFAULT 'stable',   -- Market trend: declining, stable, growing, surging
    region_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Regional multiplier
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO skill_market_data (skill, average_hourly_rate, demand_level, project_volume, competition_level, market_trend, region_multiplier) VALUES
('frontend', 65.00, 80, 850, 7, 'stable', 1.00),
('backend', 75.00, 85, 900, 6, 'growing', 1.10),
('fullstack', 80.00, 90, 950, 5, 'growing', 1.20),
('blockchain', 120.00, 95, 700, 3, 'surging', 1.50),
('ai', 110.00, 95, 800, 4, 'surging', 1.40),
('mobile', 70.00, 75, 750, 6, 'stable', 1.00),
('design', 60.00, 60, 700, 8, 'stable', 0.90),
('marketing', 55.00, 65, 850, 9, 'stable', 0.80),
('defi', 150.00, 98, 400, 2, 'surging', 1.80),
('nft', 130.00, 85, 600, 4, 'growing', 1.60);

-- Improve query performance
CREATE INDEX idx_skill_name ON skill_market_data(skill);
CREATE INDEX idx_last_updated ON skill_market_data(last_updated);

-- Create a view to expose data for the last 7 days
CREATE VIEW skill_market_view AS
SELECT 
    skill,
    average_hourly_rate,
    demand_level,
    project_volume,
    competition_level,
    market_trend,
    region_multiplier,
    last_updated
FROM skill_market_data
WHERE last_updated > NOW() - INTERVAL '7 days';

-- Enable Row-Level Security
ALTER TABLE skill_market_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access to all rows
CREATE POLICY "Allow read access" ON skill_market_data
    FOR SELECT USING (true);    
    
-- Create a function to auto-update the 'last_updated' timestamp
CREATE OR REPLACE FUNCTION update_skill_timestamps()
RETURNS trigger AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to invoke the function before each row update
CREATE TRIGGER update_skill_market_data_timestamp
    BEFORE UPDATE ON skill_market_data
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_timestamps();