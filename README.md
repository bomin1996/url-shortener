# URL Shortener Service

대규모 트래픽 처리를 고려한 URL 단축 서비스입니다.  
단순 기능 구현을 넘어, **부하 테스트 → 병목 분석 → 성능 최적화** 사이클을 경험하는 데 초점을 맞췄습니다.

## Architecture

```
Client
  │
  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐
│  Express │───▶│   Redis   │───▶│   MySQL   │
│  Server  │    │  (Cache)  │    │   (Main)  │
└──────────┘    └───────────┘    └───────────┘
  │
  ▼
┌──────────────────────────────┐
│  Artillery (Load Testing)    │
└──────────────────────────────┘
```

### 요청 흐름

1. **URL 생성** (`POST /api/shorten`)
   - 원본 URL을 DB에 저장 → Auto Increment ID를 Base62로 인코딩 → short code 반환

2. **리다이렉트** (`GET /:shortCode`)
   - Redis 캐시 확인 → 있으면 즉시 리다이렉트
   - 없으면 DB 조회 → 캐시 저장 → 리다이렉트

3. **통계 조회** (`GET /api/stats/:shortCode`)
   - 클릭 수, 생성일 등 통계 반환

## Tech Stack

| 구분 | 기술 |
|------|------|
| Runtime | Node.js 18 |
| Language | TypeScript |
| Framework | Express |
| Database | MySQL 8.0 |
| Cache | Redis |
| Container | Docker, Docker Compose |
| API Docs | Swagger (OpenAPI 3.0) |
| Load Test | Artillery |

## API

### URL 단축 생성

```bash
POST /api/shorten
Content-Type: application/json

{
  "url": "https://www.example.com/very/long/url"
}
```

**Response (201)**
```json
{
  "shortCode": "1a",
  "shortUrl": "http://localhost:3000/1a",
  "originalUrl": "https://www.example.com/very/long/url"
}
```

### 리다이렉트

```bash
GET /:shortCode
# → 301 Redirect to original URL
```

### 통계 조회

```bash
GET /api/stats/:shortCode
```

**Response (200)**
```json
{
  "shortCode": "1a",
  "originalUrl": "https://www.example.com/very/long/url",
  "clickCount": 42,
  "createdAt": "2026-04-07T12:00:00.000Z"
}
```

## Quick Start

### Docker Compose (권장)

```bash
docker-compose up -d
```

### 로컬 실행

```bash
# 의존성 설치
npm install

# .env 설정
cp .env.example .env
# .env 파일에서 DB 정보 수정

# 개발 모드
npm run dev

# 빌드 & 실행
npm run build
npm start
```

## Performance Optimization

### Before (MySQL Only)

| 지표 | 값 |
|------|------|
| 평균 응답 시간 | - |
| p95 응답 시간 | - |
| 처리량 (req/s) | - |

### After (Redis Cache 적용)

| 지표 | 값 |
|------|------|
| 평균 응답 시간 | - |
| p95 응답 시간 | - |
| 처리량 (req/s) | - |

> 부하 테스트 후 결과를 업데이트합니다.

### 부하 테스트 실행 방법

```bash
# 1. Docker 환경 실행
docker-compose up -d

# 2. URL 생성 부하 테스트 (최대 100 req/s, 2분)
npm run loadtest:create

# 3. 리다이렉트 부하 테스트 (최대 500 req/s, 2분)
npm run loadtest:redirect
```

## Project Structure

```
src/
├── app.ts                 # Express 앱 설정
├── server.ts              # 서버 진입점
├── config/
│   ├── database.ts        # MySQL 연결 설정
│   ├── redis.ts           # Redis 연결 설정
│   └── swagger.ts         # Swagger 설정
├── controllers/
│   └── url.controller.ts  # 요청/응답 처리
├── middleware/
│   └── rateLimiter.ts     # Rate Limiting 설정
├── services/
│   └── url.service.ts     # 비즈니스 로직 (캐싱 포함)
├── routes/
│   └── url.route.ts       # 라우트 정의 (Swagger 문서)
└── utils/
    └── base62.ts          # Base62 인코딩/디코딩
tests/
├── unit/
│   └── base62.test.ts     # Base62 유닛 테스트
└── integration/
    └── url.test.ts        # API 통합 테스트
```

## Design Decisions

### Base62 인코딩을 선택한 이유

- URL-safe 문자만 사용 (0-9, a-z, A-Z)
- Auto Increment ID 기반으로 충돌 없음
- 짧은 코드 생성 가능 (62^6 = 약 568억 개)

### Rate Limiting

API 남용 방지를 위한 요청 제한:

| 엔드포인트 | 제한 |
|------|------|
| `POST /api/shorten` | 분당 30회 |
| `GET /:shortCode` | 분당 200회 |
| 전체 API | 분당 100회 |

- `RateLimit-*` 표준 헤더로 남은 요청 수 확인 가능
- 제한 초과 시 `429 Too Many Requests` 응답

### Redis 캐싱 전략

- **Cache-Aside 패턴**: 읽기 요청 시 캐시 우선 조회
- 리다이렉트(읽기)가 생성(쓰기)보다 압도적으로 많은 읽기 집중 워크로드에 적합
- TTL 설정으로 메모리 관리
