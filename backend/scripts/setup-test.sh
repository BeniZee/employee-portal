#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up test environment...${NC}"

# Check if PostgreSQL is running
if ! pg_isready; then
    echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    exit 1
fi

# Create test database if it doesn't exist
echo -e "${YELLOW}Creating test database...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'employee_portal_test'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE employee_portal_test"

# Drop and recreate test database
echo -e "${YELLOW}Recreating test database...${NC}"
psql -U postgres -c "DROP DATABASE IF EXISTS employee_portal_test"
psql -U postgres -c "CREATE DATABASE employee_portal_test"

# Create .env.test file
echo -e "${YELLOW}Creating test environment file...${NC}"
cat > .env.test << EOL
NODE_ENV=test
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/employee_portal_test
JWT_SECRET=test-secret-key-change-in-production
JWT_REMEMBER_SECRET=test-remember-secret-key-change-in-production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EOL

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
NODE_ENV=test node scripts/init-db.js

# Run test data seed
echo -e "${YELLOW}Seeding test data...${NC}"
NODE_ENV=test node scripts/seed-test-data.js

echo -e "${GREEN}Test environment setup complete!${NC}"
echo -e "${YELLOW}To run tests:${NC}"
echo "npm test          # Run all tests"
echo "npm run test:watch # Run tests in watch mode"
echo "npm run test:coverage # Generate coverage report" 