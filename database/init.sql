-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProductDB')
BEGIN
    CREATE DATABASE ProductDB;
END
GO

USE ProductDB;
GO

-- Create products table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(1000),
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        category NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    -- Create index for better performance
    CREATE INDEX idx_products_name ON products(name);
    CREATE INDEX idx_products_category ON products(category);
END
GO

-- Create trigger for updated_at
CREATE OR ALTER TRIGGER trg_products_updated
ON products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE products 
    SET updated_at = GETDATE() 
    WHERE id IN (SELECT DISTINCT id FROM inserted);
END
GO

-- Stored Procedures

-- Create Product
CREATE OR ALTER PROCEDURE sp_CreateProduct
    @name NVARCHAR(200),
    @description NVARCHAR(1000),
    @price DECIMAL(10,2),
    @quantity INT,
    @category NVARCHAR(100)
AS
BEGIN
    INSERT INTO products (name, description, price, quantity, category)
    VALUES (@name, @description, @price, @quantity, @category);
    
    SELECT * FROM products WHERE id = SCOPE_IDENTITY();
END
GO

-- Get All Products
CREATE OR ALTER PROCEDURE sp_GetAllProducts
AS
BEGIN
    SELECT 
        id, 
        name, 
        description, 
        price, 
        quantity, 
        category,
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
        FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
    FROM products
    ORDER BY id DESC;
END
GO

-- Get Product By ID
CREATE OR ALTER PROCEDURE sp_GetProductById
    @id INT
AS
BEGIN
    SELECT 
        id, 
        name, 
        description, 
        price, 
        quantity, 
        category,
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
        FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
    FROM products
    WHERE id = @id;
END
GO

-- Update Product
CREATE OR ALTER PROCEDURE sp_UpdateProduct
    @id INT,
    @name NVARCHAR(200),
    @description NVARCHAR(1000),
    @price DECIMAL(10,2),
    @quantity INT,
    @category NVARCHAR(100)
AS
BEGIN
    UPDATE products
    SET name = @name,
        description = @description,
        price = @price,
        quantity = @quantity,
        category = @category,
        updated_at = GETDATE()
    WHERE id = @id;
    
    SELECT * FROM products WHERE id = @id;
END
GO

-- Delete Product
CREATE OR ALTER PROCEDURE sp_DeleteProduct
    @id INT
AS
BEGIN
    DELETE FROM products WHERE id = @id;
    SELECT @@ROWCOUNT as deleted_count;
END
GO

-- Search Products
CREATE OR ALTER PROCEDURE sp_SearchProducts
    @searchTerm NVARCHAR(200)
AS
BEGIN
    SELECT 
        id, 
        name, 
        description, 
        price, 
        quantity, 
        category,
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
        FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
    FROM products
    WHERE name LIKE '%' + @searchTerm + '%'
       OR description LIKE '%' + @searchTerm + '%'
       OR category LIKE '%' + @searchTerm + '%'
    ORDER BY id DESC;
END
GO

-- Insert sample data
IF (SELECT COUNT(*) FROM products) = 0
BEGIN
    INSERT INTO products (name, description, price, quantity, category) VALUES
    ('Gaming Laptop', 'High-performance gaming laptop with RTX 4080', 1999.99, 15, 'Electronics'),
    ('Wireless Mouse', 'Ergonomic wireless mouse with RGB', 49.99, 50, 'Accessories'),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 129.99, 30, 'Accessories'),
    ('4K Monitor', '27-inch 4K UHD monitor', 449.99, 20, 'Electronics'),
    ('USB-C Hub', '7-in-1 USB-C multiport adapter', 39.99, 100, 'Cables & Adapters'),
    ('External SSD', '1TB Portable SSD', 159.99, 25, 'Storage'),
    ('Webcam', '1080p HD Webcam with microphone', 79.99, 40, 'Electronics'),
    ('Desk Mat', 'Large gaming desk mat', 29.99, 75, 'Accessories');
END
GO

SELECT 'Database initialized successfully!' as Status;
SELECT COUNT(*) as TotalProducts FROM products;
GO