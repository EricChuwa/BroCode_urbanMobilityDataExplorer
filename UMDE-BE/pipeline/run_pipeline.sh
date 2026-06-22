#!/bin/bash

# ── UMDE Data Pipeline Runner ──────────────────────────────

set -e  # Stop immediately if any command fails

#  Colors for output 
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

#  Navigate to project root 
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   UMDE Data Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

#  Step 1: Load and Clean 
echo -e "${BLUE}[1/3] Loading and cleaning raw data...${NC}"
python3 UMDE-BE/pipeline/loadClean_pipeline.py
echo -e "${GREEN}✓ Cleaning complete${NC}"
echo ""

#  Step 2: Feature Engineering 
echo -e "${BLUE}[2/3] Engineering derived features...${NC}"
python3 UMDE-BE/pipeline/features.py
echo -e "${GREEN}✓ Features complete${NC}"
echo ""

#  Step 3: Database Insert 
echo -e "${BLUE}[3/3] Loading data into PostgreSQL...${NC}"
python3 UMDE-BE/pipeline/db_insert.py
echo -e "${GREEN}✓ Database loaded${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Pipeline complete!${NC}"
echo -e "${GREEN}========================================${NC}"