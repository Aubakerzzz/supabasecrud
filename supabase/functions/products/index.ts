import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import sql from 'https://esm.sh/mssql@9.1.1'

const dbConfig = {
  server: Deno.env.get('MSSQL_HOST') || 'mssql',
  user: Deno.env.get('MSSQL_USER') || 'sa',
  password: Deno.env.get('MSSQL_PASSWORD') || 'YourStrong!Passw0rd',
  database: Deno.env.get('MSSQL_DATABASE') || 'ProductDB',
  port: parseInt(Deno.env.get('MSSQL_PORT') || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const productId = pathParts[pathParts.length - 1];
    
    console.log(`Processing ${req.method} request for product ID: ${productId}`);
    
    // Connect to MSSQL
    const pool = await sql.connect(dbConfig);
    let result: any;
    let status = 200;

    // Routes
    if (req.method === 'GET') {
      if (productId && productId !== 'products' && !isNaN(Number(productId))) {
        // Get single product
        const request = pool.request();
        request.input('id', sql.Int, parseInt(productId));
        result = await request.execute('sp_GetProductById');
        status = result.recordset.length > 0 ? 200 : 404;
      } else {
        // Get all products
        const request = pool.request();
        result = await request.execute('sp_GetAllProducts');
      }
    } 
    else if (req.method === 'POST') {
      const product = await req.json();
      
      if (!product.name || product.name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      const request = pool.request();
      request.input('name', sql.NVarChar(200), product.name.trim());
      request.input('description', sql.NVarChar(1000), product.description || null);
      request.input('price', sql.Decimal(10, 2), parseFloat(product.price));
      request.input('quantity', sql.Int, parseInt(product.quantity));
      request.input('category', sql.NVarChar(100), product.category || null);
      
      result = await request.execute('sp_CreateProduct');
      status = 201;
    } 
    else if (req.method === 'PUT') {
      const product = await req.json();
      
      const request = pool.request();
      request.input('id', sql.Int, parseInt(productId));
      request.input('name', sql.NVarChar(200), product.name);
      request.input('description', sql.NVarChar(1000), product.description || null);
      request.input('price', sql.Decimal(10, 2), parseFloat(product.price));
      request.input('quantity', sql.Int, parseInt(product.quantity));
      request.input('category', sql.NVarChar(100), product.category || null);
      
      result = await request.execute('sp_UpdateProduct');
      status = result.recordset.length > 0 ? 200 : 404;
    } 
    else if (req.method === 'DELETE') {
      const request = pool.request();
      request.input('id', sql.Int, parseInt(productId));
      result = await request.execute('sp_DeleteProduct');
      status = result.recordset[0]?.deleted_count > 0 ? 200 : 404;
    }
    else {
      throw new Error('Method not allowed');
    }

    await pool.close();

    return new Response(
      JSON.stringify(result.recordset || result),
      { 
        status, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
},{ port: 54321, hostname: "0.0.0.0" });