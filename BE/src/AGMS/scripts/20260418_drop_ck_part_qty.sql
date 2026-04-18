IF EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Part_Qty'
      AND parent_object_id = OBJECT_ID(N'dbo.ServicePartDetails')
)
BEGIN
    ALTER TABLE dbo.ServicePartDetails
    DROP CONSTRAINT CK_Part_Qty;
END
GO
