# 🚁 Helicopter and Terrain

**WebGL2 3D 헬리콥터 시뮬레이션 게임**

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge)](https://devouring123.github.io/Helicopter-and-terrain/)
[![Language](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/devouring123/Helicopter-and-terrain)
[![WebGL](https://img.shields.io/badge/WebGL2-000000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)

## 📋 프로젝트 개요

WebGL2와 gl-matrix 라이브러리를 사용하여 구현한 3D 헬리콥터 시뮬레이션입니다. 실시간 3D 렌더링과 물리 기반 조작을 통해 몰입감 있는 헬리콥터 비행 체험을 제공합니다.

### 🎯 주요 목표
- **WebGL2 마스터**: 저수준 3D 그래픽스 프로그래밍 경험
- **3D 수학 구현**: 행렬 변환, 벡터 연산, 카메라 시스템
- **물리 시뮬레이션**: 헬리콥터 비행 역학 구현
- **실시간 렌더링**: 부드러운 60fps 3D 그래픽스

## ✨ 주요 기능

### 🎮 헬리콥터 컨트롤
- **WASD 키**: 전후좌우 이동
- **마우스 조작**: 시야각 제어  
- **회전 프로펠러**: 물리적 사실성 구현
- **높이 조절**: 상승/하강 컨트롤

### 🏞️ 3D 지형 렌더링
- **절차적 터레인**: 동적 지형 생성
- **텍스처 매핑**: 사실적 지표면 표현
- **다중 조명**: 20개 동적 라이트 시스템
- **그림자 효과**: 실시간 그림자 렌더링

### ⚡ 성능 최적화
- **WebGL2 활용**: 최신 그래픽스 API
- **효율적 메모리 관리**: 버퍼 최적화
- **LOD 시스템**: 거리별 디테일 조절

## 🛠️ 기술 스택

| 분야 | 기술 스택 |
|------|-----------|
| **Frontend** | Vanilla JavaScript, WebGL2 |
| **3D Math** | gl-matrix.js |
| **Graphics** | Vertex/Fragment Shaders |
| **Physics** | Custom Physics Engine |

## 🎨 기술적 구현 세부사항

### WebGL2 렌더링 파이프라인
```javascript
// 핵심 렌더링 루프
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

// 행렬 변환
let M = mat4.create();
mat4.translate(M, M, [0, 0, 1]);
let V = mat4.create(); // 뷰 행렬
let P = mat4.create(); // 프로젝션 행렬
```

### 다중 조명 시스템
- **DirectionalLight**: 주광원 (태양광)
- **PointLights**: 20개 동적 포인트 라이트
- **Phong Shading**: 사실적 재질 표현

### 물리 기반 헬리콥터 모델
- **로터 시스템**: 메인/테일 로터 물리학
- **공기역학**: 양력, 항력, 토크 계산
- **관성 시뮬레이션**: 질량 기반 움직임

## 📊 성능 지표

- **프레임레이트**: 안정적 60fps
- **폴리곤 수**: 최대 100K 삼각형
- **드로우 콜**: 최적화된 배치 렌더링
- **메모리 사용량**: 50MB 이하

## 🎯 개발 성과

### 기술적 도전과 해결
1. **WebGL2 셰이더 최적화**
   - 문제: 복잡한 조명 계산으로 인한 성능 저하
   - 해결: 유니폼 버퍼 객체와 인스턴싱 활용

2. **3D 수학 구현**
   - 문제: 복잡한 행렬 연산과 좌표계 변환
   - 해결: gl-matrix 라이브러리로 안정적 구현

3. **물리 시뮬레이션**
   - 문제: 사실적인 헬리콥터 비행감 구현
   - 해결: 실제 항공역학 원리 적용

### 학습 성과
- **저수준 그래픽스**: WebGL2 API 완전 이해
- **3D 수학**: 선형대수학 실전 적용
- **게임 엔진 원리**: 렌더링 파이프라인 구축

## 🚀 실행 방법

```bash
# 레포지토리 클론
git clone https://github.com/devouring123/Helicopter-and-terrain.git

# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

## 🌟 데모 링크

### [🎮 라이브 데모 체험하기](https://devouring123.github.io/Helicopter-and-terrain/)

## 📈 향후 계획

- [ ] **물리 엔진 고도화**: 풍력, 난기류 효과
- [ ] **지형 생성기**: 다양한 바이옴 지원  
- [ ] **멀티플레이어**: WebRTC 기반 협동 모드
- [ ] **VR 지원**: WebXR API 통합

## 👨‍💻 개발자 정보

**서명교 (devouring123)**  
📧 devouring123@gmail.com  
🔗 [GitHub](https://github.com/devouring123)

---

*"WebGL2로 구현한 몰입감 있는 3D 헬리콥터 시뮬레이션"*