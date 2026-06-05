#!/bin/sh
echo "Starting Supabase Edge Runtime..."
echo "Current directory: $(pwd)"
echo "Looking for functions in ./functions"
ls -la ./functions/
echo "Products function exists:"
ls -la ./functions/products/

# Just start with port, no main-service flag
exec edge-runtime start --port 54321