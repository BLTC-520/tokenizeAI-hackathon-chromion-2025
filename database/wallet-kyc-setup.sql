-- Create wallet_kyc table for KYC verification
CREATE TABLE wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL UNIQUE CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    is_kyc_verified BOOLEAN NOT NULL DEFAULT false,
    kyc_level INTEGER NOT NULL DEFAULT 0 CHECK (kyc_level >= 0 AND kyc_level <= 10),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'expired')),
    verification_date TIMESTAMP WITH TIME ZONE,
    nft_token_id BIGINT,
    nft_contract_address VARCHAR(42),
    nft_minted_at TIMESTAMP WITH TIME ZONE,
    nft_transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some test KYC data
INSERT INTO wallet_kyc (wallet_address, is_kyc_verified, kyc_level, kyc_status, verification_date) VALUES
('0x1234567890123456789012345678901234567890', true, 3, 'approved', '2024-01-15T10:30:00+00:00'),
('0x2345678901234567890123456789012345678901', true, 2, 'approved', '2024-02-20T14:45:00+00:00'),
('0x3456789012345678901234567890123456789012', true, 1, 'approved', '2024-03-10T09:15:00+00:00'),
('0x4567890123456789012345678901234567890123', true, 3, 'approved', '2024-01-05T11:20:00+00:00'),
('0x5678901234567890123456789012345678901234', true, 2, 'approved', '2024-02-01T16:30:00+00:00');

-- Improve query performance
CREATE INDEX idx_wallet_kyc_address ON wallet_kyc(wallet_address);
CREATE INDEX idx_wallet_kyc_status ON wallet_kyc(kyc_status);
CREATE INDEX idx_wallet_kyc_verified ON wallet_kyc(is_kyc_verified);

-- Enable Row-Level Security
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access to all rows
CREATE POLICY "Allow read access to wallet_kyc" ON wallet_kyc
    FOR SELECT USING (true);

-- Create a function to auto-update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_wallet_kyc_timestamps()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to invoke the function before each row update
CREATE TRIGGER update_wallet_kyc_timestamp
    BEFORE UPDATE ON wallet_kyc
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_kyc_timestamps();