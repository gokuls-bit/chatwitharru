#!/bin/bash
set -e

# Initialize failure count
FAILURES=0

check_var() {
  local var_name=$1
  if [ -z "${!var_name}" ]; then
    echo -e "\e[31mMISSING: $var_name\e[0m"
    FAILURES=$((FAILURES+1))
  fi
}

echo "Running Environment Checks..."

# Frontend checks
check_var "NEXT_PUBLIC_SOCKET_URL"
if [ -n "$NEXT_PUBLIC_SOCKET_URL" ] && [ "$NODE_ENV" = "production" ]; then
  if [[ ! "$NEXT_PUBLIC_SOCKET_URL" == https://* ]]; then
    echo -e "\e[31mINVALID: NEXT_PUBLIC_SOCKET_URL must start with https:// in production\e[0m"
    FAILURES=$((FAILURES+1))
  fi
fi

# Backend checks
check_var "MONGODB_URI"
if [ -n "$MONGODB_URI" ]; then
  if [[ ! "$MONGODB_URI" == mongodb+srv://* ]] && [[ ! "$MONGODB_URI" == mongodb://* ]]; then
    echo -e "\e[31mINVALID: MONGODB_URI format\e[0m"
    FAILURES=$((FAILURES+1))
  fi
fi

check_var "FRONTEND_URL"
check_var "PORT"
if [ -n "$PORT" ]; then
  if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
    echo -e "\e[31mINVALID: PORT must be a number between 1024 and 65535\e[0m"
    FAILURES=$((FAILURES+1))
  fi
fi

check_var "NODE_ENV"
if [ -n "$NODE_ENV" ]; then
  if [[ "$NODE_ENV" != "development" ]] && [[ "$NODE_ENV" != "staging" ]] && [[ "$NODE_ENV" != "production" ]]; then
    echo -e "\e[31mINVALID: NODE_ENV format\e[0m"
    FAILURES=$((FAILURES+1))
  fi
fi

check_var "BCRYPT_ROUNDS"

if [ $FAILURES -gt 0 ]; then
  echo "Environment checks failed with $FAILURES errors."
  exit 1
fi

echo "All environment checks passed."
exit 0
