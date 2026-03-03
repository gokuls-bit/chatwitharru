#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

FAILED=0

echo "Checking Frontend TypeScript..."
if cd arru-frontend && npx tsc --noEmit --strict; then
  echo "Frontend check passed."
  cd ..
else
  echo -e "\e[31mTypeScript check FAILED for frontend\e[0m"
  FAILED=1
  cd ..
fi

echo "Checking Backend TypeScript..."
if cd arru-backend && npx tsc --noEmit --strict; then
  echo "Backend check passed."
  cd ..
else
  echo -e "\e[31mTypeScript check FAILED for backend\e[0m"
  FAILED=1
  cd ..
fi

if [ $FAILED -ne 0 ]; then
  exit 1
fi

echo -e "\e[32mTypeScript check PASSED for frontend and backend\e[0m"
exit 0
