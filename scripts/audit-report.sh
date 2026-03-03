#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

FAILED=0

check_audit() {
  local target_dir=$1
  echo "Checking npm audit for $target_dir"
  cd $target_dir || exit 1
  
  audit_json=$(npm audit --json || true)
  
  high_count=$(echo "$audit_json" | grep -o '"high": [0-9]*' | head -1 | awk '{print $2}')
  critical_count=$(echo "$audit_json" | grep -o '"critical": [0-9]*' | head -1 | awk '{print $2}')
  
  high_count=${high_count:-0}
  critical_count=${critical_count:-0}
  
  if [ "$high_count" -gt 0 ] || [ "$critical_count" -gt 0 ]; then
    echo -e "\e[31mFAIL: Found $high_count High and $critical_count Critical vulnerabilities in $target_dir\e[0m"
    echo "| Package | Severity |"
    echo "|---------|----------|"
    echo "$audit_json" | grep -E '"name"|"severity"' | sed 'N;s/\n/ /' | grep -E 'high|critical'
    FAILED=1
  else
    echo -e "\e[32mPASS: No High/Critical vulnerabilities in $target_dir\e[0m"
  fi
  cd ..
}

check_audit "arru-frontend"
check_audit "arru-backend"

if [ $FAILED -ne 0 ]; then
  exit 1
fi
exit 0
