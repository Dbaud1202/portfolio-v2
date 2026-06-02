// Portfolio content — ko/en bilingual
const PORTFOLIO_DATA = {
  meta: {
    name: { ko: "유 명", en: "YOO MYUNG" },
    handle: "@yoo_myung",
    role: { ko: "소프트웨어 엔지니어", en: "SOFTWARE ENGINEER" },
    tagline: {
      ko: "사용자 경험을 최우선으로 — 즐겁고 쉽게 사용할 수 있는 제품을 만듭니다.",
      en: "User experience first — building products that are delightful and effortless.",
    },
    location: "Seoul, KR",
    email: "yoo120297@gmail.com",
    instagram: "instagram.com/yoo_myung",
    github: "github.com/yoo-myung",
  },

  nav: {
    home: { ko: "홈", en: "HOME" },
    about: { ko: "소개", en: "ABOUT" },
    work: { ko: "작업", en: "WORK" },
    timeline: { ko: "이력", en: "TIMELINE" },
    playground: { ko: "실험실", en: "PLAYGROUND" },
    contact: { ko: "연락", en: "CONTACT" },
  },

  about: {
    title: { ko: "ABOUT ME", en: "ABOUT ME" },
    hello: { ko: "안녕하세요 👋", en: "Hello there 👋" },
    intro: {
      ko: "저는 사용자 경험을 최우선으로 생각하는 개발자가 목표인 사람입니다. 모든 사람이 즐겁고 쉽게 사용할 수 있게 만드는 것이 목표 입니다. 새로운 기술을 배우고 적용하는 것에 열정적입니다.",
      en: "I'm a developer who puts user experience first. My goal is to build things everyone can enjoy and use effortlessly. I'm passionate about learning new technologies and applying them.",
    },
    stats: [
      { value: "1+", label: { ko: "년 경력", en: "YEARS EXP." } },
      { value: "08", label: { ko: "프로젝트", en: "PROJECTS" } },
      { value: "12", label: { ko: "기술 스택", en: "STACKS" } },
      { value: "100%", label: { ko: "열정", en: "PASSION" } },
    ],
    values: [
      {
        icon: "◎",
        title: { ko: "목표 지향", en: "GOAL-ORIENTED" },
        body: { ko: "명확한 목표를 설정하고 체계적으로 접근하여 최고의 결과를 만들어냅니다.", en: "Set clear goals and approach them systematically for the best outcome." },
      },
      {
        icon: "◇",
        title: { ko: "협업 중시", en: "COLLABORATIVE" },
        body: { ko: "팀원들과의 소통을 통해 더 나은 아이디어를 발굴하고 함께 성장합니다.", en: "Discover better ideas and grow together through team communication." },
      },
      {
        icon: "△",
        title: { ko: "지속적 학습", en: "ALWAYS LEARNING" },
        body: { ko: "빠르게 변화하는 기술 트렌드에 맞춰 꾸준히 학습하고 발전합니다.", en: "Continuously learn and evolve with fast-moving tech trends." },
      },
      {
        icon: "✦",
        title: { ko: "품질 추구", en: "QUALITY FIRST" },
        body: { ko: "사용자에게 최고의 경험을 제공하기 위해 디테일에 집중합니다.", en: "Focus on the details to deliver the best possible experience." },
      },
    ],
    skills: [
      {
        group: "FRONTEND",
        items: ["JavaScript", "TypeScript", "React", "HTML5", "CSS3", "Three.js"],
      },
      {
        group: "BACKEND",
        items: ["Java", "Node.js", "Express", "Spring"],
      },
      {
        group: "DATABASE & TOOLS",
        items: ["MySQL", "MongoDB", "Git", "Figma"],
      },
    ],
    strengths: [
      { ko: "빠른 학습력", en: "Fast Learner" },
      { ko: "문제 해결", en: "Problem Solving" },
      { ko: "협업 능력", en: "Team Player" },
      { ko: "책임감", en: "Ownership" },
    ],
  },

  timeline: {
    title: { ko: "TIMELINE", en: "TIMELINE" },
    subtitle: {
      ko: "체계적인 학습과 실무 경험을 통해 웹 개발 역량을 쌓아왔습니다.",
      en: "Building web development skills through structured learning and real-world experience.",
    },
    items: [
      {
        kind: "edu",
        date: "2023.03 — 2026.01",
        org: { ko: "세명컴퓨터고등학교", en: "Semyung Computer High School" },
        detail: { ko: "보안과 10기 / 도제 8기", en: "Security Track, Cohort 10 / Dual Class 8" },
      },
      {
        kind: "work",
        date: "2024.11 — NOW",
        org: { ko: "eNsecure", en: "eNsecure" },
        detail: { ko: "기업부설연구소 · 개발자", en: "In-house R&D Lab · Developer" },
      },
      {
        kind: "cert",
        date: "2025.07",
        org: { ko: "정보기기운용기능사", en: "Info Equipment Operation, Craftsman" },
        detail: { ko: "한국산업인력공단 · 필기면제 / 실기 합격", en: "HRDK · Practical passed (written exempted)" },
      },
      {
        kind: "cert",
        date: "2025.09",
        org: { ko: "정보처리산업기사", en: "Information Processing, Industrial Engineer" },
        detail: { ko: "한국산업인력공단 · 필기 및 실기 합격", en: "HRDK · Written & practical passed" },
      },
      {
        kind: "edu",
        date: "2026.03 — NOW",
        org: { ko: "동양미래대학교", en: "Dongyang Mirae University" },
        detail: { ko: "컴퓨터공학과 · p-tech (일학습병행제)", en: "Computer Engineering · p-tech (work-study)" },
      },
    ],
  },

  projects: {
    title: { ko: "MY WORK", en: "MY WORK" },
    subtitle: {
      ko: "다양한 프로젝트로 쌓은 경험과 기술력 — 사용자 경험과 코드 품질을 중시합니다.",
      en: "Projects built with focus on user experience and code quality.",
    },
    filters: [
      { id: "all", label: { ko: "전체", en: "ALL" } },
      { id: "fullstack", label: { ko: "풀스택", en: "FULL-STACK" } },
      { id: "frontend", label: { ko: "프론트엔드", en: "FRONTEND" } },
      { id: "team", label: { ko: "팀 프로젝트", en: "TEAM" } },
    ],
    items: [
      {
        id: "p01",
        index: "01",
        title: { ko: "유명 마켓", en: "YOOMYUNG MARKET" },
        type: "fullstack",
        tag: "FULL STACK",
        year: "2025",
        scope: { ko: "중고거래 플랫폼", en: "Secondhand marketplace" },
        body: {
          ko: "React · MongoDB · Node.js로 구축한 중고거래 플랫폼. 반응형 디자인과 사용자 친화적 인터페이스를 제공합니다.",
          en: "A secondhand marketplace built with React, MongoDB and Node.js. Responsive and human-friendly UI.",
        },
        stack: ["React", "MongoDB", "Node.js", "Express"],
        team: false,
        accent: "#00f0ff",
      },
      {
        id: "p02",
        index: "02",
        title: { ko: "포트폴리오 사이트", en: "PORTFOLIO" },
        type: "frontend",
        tag: "FRONTEND",
        year: "2025",
        scope: { ko: "개인 포트폴리오", en: "Personal site" },
        body: {
          ko: "저를 소개하기 위한 포트폴리오 사이트. 가벼운 인터랙션과 깔끔한 타이포그래피.",
          en: "A personal portfolio to introduce my work — light interactions, clean typography.",
        },
        stack: ["React", "TypeScript", "CSS3"],
        team: false,
        accent: "#ff2bd1",
      },
      {
        id: "p03",
        index: "03",
        title: { ko: "랜덤 미션 챌린지", en: "RANDOM MISSION" },
        type: "frontend",
        tag: "FRONTEND",
        year: "2025",
        scope: { ko: "데일리 미션 챌린지", en: "Daily challenge app" },
        body: {
          ko: "여러 미션을 랜덤으로 뽑아 사용자가 선택한 미션을 수행하는 챌린지 사이트.",
          en: "Pick a random mission from the pool and complete the challenge of the day.",
        },
        stack: ["React", "TypeScript", "CSS3"],
        team: false,
        accent: "#ff2bd1",
      },
      {
        id: "p04",
        index: "04",
        title: { ko: "랜덤 음식 추천", en: "WHAT TO EAT" },
        type: "frontend",
        tag: "FRONTEND",
        year: "2025",
        scope: { ko: "음식 결정 도우미", en: "Decide-for-me food picker" },
        body: {
          ko: "오늘 뭐 먹지? — 랜덤으로 음식을 뽑아 사용자의 선택을 도와줍니다.",
          en: "Can't decide what to eat? Spin the wheel and we'll pick for you.",
        },
        stack: ["React", "TypeScript", "CSS3"],
        team: false,
        accent: "#9d4eff",
      },
      {
        id: "p05",
        index: "05",
        title: { ko: "사내 보안 대시보드", en: "SECURITY DASHBOARD" },
        type: "fullstack",
        tag: "WORK · FULL STACK",
        year: "2025",
        scope: { ko: "eNsecure · 내부 도구", en: "eNsecure · internal tool" },
        body: {
          ko: "기업부설연구소 실무 프로젝트. 보안 이벤트를 실시간으로 모니터링하고 시각화하는 대시보드.",
          en: "Built at the in-house R&D lab. Real-time security event monitoring with rich visualizations.",
        },
        stack: ["React", "Java", "Spring", "MySQL"],
        team: true,
        accent: "#00f0ff",
      },
      {
        id: "p06",
        index: "06",
        title: { ko: "도제 협업 ERP", en: "DUAL-CLASS ERP" },
        type: "fullstack",
        tag: "TEAM · FULL STACK",
        year: "2024",
        scope: { ko: "팀 프로젝트 (4인)", en: "Team project (4 members)" },
        body: {
          ko: "도제반 팀과 함께 만든 소규모 ERP. 출퇴근/과제/일지 관리 모듈을 갖춘 사내용 도구.",
          en: "A small ERP built with my dual-class team — attendance, tasks, and journal modules.",
        },
        stack: ["Node.js", "Express", "MySQL", "JavaScript"],
        team: true,
        accent: "#7cffb2",
      },
      {
        id: "p07",
        index: "07",
        title: { ko: "WebGL 실험: 액체 텍스트", en: "LAB · LIQUID TEXT" },
        type: "frontend",
        tag: "PLAYGROUND",
        year: "2025",
        scope: { ko: "셰이더 실험", en: "Shader experiment" },
        body: {
          ko: "GLSL 셰이더로 만든 액체처럼 흐르는 타이포그래피. 마우스 인터랙션 적용.",
          en: "Fluid, liquid-like typography built in GLSL — reacts to the cursor.",
        },
        stack: ["Three.js", "GLSL", "TypeScript"],
        team: false,
        accent: "#ff2bd1",
      },
      {
        id: "p08",
        index: "08",
        title: { ko: "Y2K 컴포넌트 키트", en: "Y2K UI KIT" },
        type: "frontend",
        tag: "PLAYGROUND",
        year: "2025",
        scope: { ko: "디자인 시스템 실험", en: "Design system experiment" },
        body: {
          ko: "크롬 / 홀로그램 / 와이어프레임 미학으로 만든 작은 UI 컴포넌트 라이브러리.",
          en: "A small component library exploring chrome, holographic, and wireframe aesthetics.",
        },
        stack: ["React", "CSS3", "Framer Motion"],
        team: false,
        accent: "#00f0ff",
      },
    ],
  },

  playground: {
    title: { ko: "PLAYGROUND", en: "PLAYGROUND" },
    subtitle: {
      ko: "그냥 만들고 싶어서 만든 것들. 클릭, 드래그, 호버 해보세요. 도트아트도 구경해보세요!",
      en: "Things made just for fun. Click, drag, hover — go wild. Check out the dot art too!",
    },
    items: [
      {
        kind: "cube",
        title: { ko: "FRAGMENT 01", en: "FRAGMENT 01" },
        caption: { ko: "드래그해서 회전", en: "Drag to rotate" },
      },
      {
        kind: "torus",
        title: { ko: "FRAGMENT 02", en: "FRAGMENT 02" },
        caption: { ko: "호버하면 일그러짐", en: "Hover to distort" },
      },
      {
        kind: "ico",
        title: { ko: "FRAGMENT 03", en: "FRAGMENT 03" },
        caption: { ko: "클릭하면 폭발", en: "Click to explode" },
      },
    ],
  },

  contact: {
    title: { ko: "GET IN TOUCH", en: "GET IN TOUCH" },
    subtitle: {
      ko: "새로운 프로젝트나 협업 기회에 대해 이야기하고 싶다면 언제든지 연락 주세요. 함께 멋진 것을 만들어봐요.",
      en: "Want to talk about a new project or collaboration? Reach out — let's build something good together.",
    },
    cta: { ko: "이메일 보내기", en: "SEND EMAIL" },
  },

  footer: {
    line1: "© 2025 YOO MYUNG. ALL RIGHTS RESERVED.",
    line2: "BUILT WITH REACT · THREE.JS · LOVE",
  },
};

export default PORTFOLIO_DATA;
