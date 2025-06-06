-- Add update trigger for tmp_drizzle_test table
CREATE TRIGGER update_tmp_drizzle_test_updated_at
BEFORE UPDATE ON tmp_drizzle_test
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
