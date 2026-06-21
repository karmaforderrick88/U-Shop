#! /bin/bash
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="http://localhost:3000"
VERBOSE=false

# Help function
show_help() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Rate Limiter Testing Tool${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Usage: ./test-rate-limiter.sh [OPTIONS] TEST_NAME"
    echo ""
    echo "Tests:"
    echo "  login              - Test login rate limiter (5 attempts in 15 min)"
    echo "  password-reset     - Test password reset limiter (3 attempts in 1 hour)"
    echo "  registration       - Test registration limiter (5 attempts in 1 hour)"
    echo "  api                - Test API limiter (60 requests per minute)"
    echo "  crud               - Test CRUD limiter (30 operations per minute)"
    echo "  all                - Run all tests"
    echo ""
    echo "Options:"
    echo "  -u, --url URL      - Base URL (default: http://localhost:3000)"
    echo "  -v, --verbose      - Show detailed curl output"
    echo "  -h, --help         - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./test-rate-limiter.sh login"
    echo "  ./test-rate-limiter.sh -v password-reset"
    echo "  ./test-rate-limiter.sh --url http://localhost:4000 all"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            TEST_NAME="$1"
            shift
            ;;
    esac
done

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ Error: curl is not installed${NC}"
    echo "Install it with: sudo apt install curl"
    exit 1
fi

# Function to make a request and check rate limit
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local attempt=$4
    local max=$5
    
    if [ "$VERBOSE" = true ]; then
        curl_output=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}" 2>&1)
    else
        curl_output=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}" 2>&1)
    fi
    
    http_code=$(echo "$curl_output" | grep "HTTP_CODE:" | cut -d':' -f2)
    response_body=$(echo "$curl_output" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "429" ]; then
        echo -e "${GREEN}  ✓ Attempt $attempt/$max: ${YELLOW}Rate limited (429)${NC}"
        if [ "$VERBOSE" = true ]; then
            echo -e "${BLUE}    Response: $response_body${NC}"
        fi
        return 0
    else
        echo -e "${BLUE}  → Attempt $attempt/$max: Request accepted ($http_code)${NC}"
        if [ "$VERBOSE" = true ]; then
            echo -e "${BLUE}    Response: $response_body${NC}"
        fi
        return 1
    fi
}

# Test login rate limiter
test_login() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} Testing Login Rate Limiter${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Expected: 5 failed login attempts allowed, then rate limited"
    echo ""
    
    local rate_limited=false
    for i in {1..7}; do
        if make_request "POST" "/login" '{"username":"testuser","password":"wrongpass"}' "$i" "7"; then
            rate_limited=true
            echo ""
            echo -e "${GREEN}✓ Login rate limiter is WORKING!${NC}"
            echo -e "${YELLOW}  Got rate limited after $i attempts${NC}"
            break
        fi
        sleep 0.5
    done
    
    if [ "$rate_limited" = false ]; then
        echo ""
        echo -e "${RED}✗ Login rate limiter NOT working${NC}"
        echo -e "${RED}  Made 7 attempts without being blocked${NC}"
    fi
}

# Test password reset rate limiter
test_password_reset() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} Testing Password Reset Rate Limiter${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Expected: 3 attempts allowed, then rate limited for 1 hour"
    echo ""
    
    local rate_limited=false
    for i in {1..5}; do
        if make_request "POST" "/forgot-password" '{"email":"test@example.com"}' "$i" "5"; then
            rate_limited=true
            echo ""
            echo -e "${GREEN}✓ Password reset rate limiter is WORKING!${NC}"
            echo -e "${YELLOW}  Got rate limited after $i attempts${NC}"
            break
        fi
        sleep 0.5
    done
    
    if [ "$rate_limited" = false ]; then
        echo ""
        echo -e "${RED}✗ Password reset rate limiter NOT working${NC}"
        echo -e "${RED}  Made 5 attempts without being blocked${NC}"
    fi
}

# Test registration rate limiter
test_registration() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} Testing Registration Rate Limiter${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Expected: 5 attempts allowed, then rate limited"
    echo ""
    
    local rate_limited=false
    for i in {1..7}; do
        if make_request "POST" "/register/request" '{"email":"test'$i'@example.com"}' "$i" "7"; then
            rate_limited=true
            echo ""
            echo -e "${GREEN}✓ Registration rate limiter is WORKING!${NC}"
            echo -e "${YELLOW}  Got rate limited after $i attempts${NC}"
            break
        fi
        sleep 0.5
    done
    
    if [ "$rate_limited" = false ]; then
        echo ""
        echo -e "${RED}✗ Registration rate limiter NOT working${NC}"
        echo -e "${RED}  Made 7 attempts without being blocked${NC}"
    fi
}

# Test API rate limiter
test_api() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} Testing API Rate Limiter${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Expected: 60 requests per minute allowed, then rate limited"
    echo "Note: This test makes 65 rapid requests"
    echo ""
    
    local rate_limited=false
    for i in {1..65}; do
        # Show progress every 10 requests
        if [ $((i % 10)) -eq 0 ]; then
            echo -e "${BLUE}  ... Testing request $i/65${NC}"
        fi
        
        if make_request "GET" "/api/sales" '' "$i" "65"; then
            rate_limited=true
            echo ""
            echo -e "${GREEN}✓ API rate limiter is WORKING!${NC}"
            echo -e "${YELLOW}  Got rate limited after $i requests${NC}"
            break
        fi
    done
    
    if [ "$rate_limited" = false ]; then
        echo ""
        echo -e "${RED}✗ API rate limiter NOT working${NC}"
        echo -e "${RED}  Made 65 requests without being blocked${NC}"
    fi
}

# Test CRUD rate limiter
test_crud() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} Testing CRUD Rate Limiter${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Expected: 30 operations per minute, then rate limited"
    echo ""
    
    local rate_limited=false
    for i in {1..35}; do
        if [ $((i % 5)) -eq 0 ]; then
            echo -e "${BLUE}  ... Testing request $i/35${NC}"
        fi
        
        if make_request "GET" "/api/stocks" '' "$i" "35"; then
            rate_limited=true
            echo ""
            echo -e "${GREEN}✓ CRUD rate limiter is WORKING!${NC}"
            echo -e "${YELLOW}  Got rate limited after $i requests${NC}"
            break
        fi
    done
    
    if [ "$rate_limited" = false ]; then
        echo ""
        echo -e "${RED}✗ CRUD rate limiter NOT working${NC}"
        echo -e "${RED}  Made 35 requests without being blocked${NC}"
    fi
}

# Main execution
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Rate Limiter Testing Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Testing against: ${YELLOW}${BASE_URL}${NC}"
echo ""

# Check if server is running
if ! curl -s -f -o /dev/null "${BASE_URL}"; then
    echo -e "${RED}✗ Error: Server is not responding at ${BASE_URL}${NC}"
    echo "Make sure your server is running with: npm start"
    exit 1
fi

echo -e "${GREEN}✓ Server is responding${NC}"

# Run tests based on argument
case "$TEST_NAME" in
    login)
        test_login
        ;;
    password-reset)
        test_password_reset
        ;;
    registration)
        test_registration
        ;;
    api)
        test_api
        ;;
    crud)
        test_crud
        ;;
    all)
        test_login
        test_password_reset
        test_registration
        test_api
        test_crud
        ;;
    "")
        echo -e "${RED}✗ No test specified${NC}"
        echo ""
        show_help
        exit 1
        ;;
    *)
        echo -e "${RED}✗ Unknown test: $TEST_NAME${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Testing complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""