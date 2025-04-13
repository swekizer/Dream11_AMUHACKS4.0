-- Create a function to increment the campaign amount
CREATE OR REPLACE FUNCTION increment_campaign_amount(campaign_id UUID, increment_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET current_amount = current_amount + increment_amount,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 