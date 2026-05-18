const foodOptions = {
  cannotEat: ["갑각류", "조개류", "생선", "견과류", "우유/유제품", "계란", "밀가루", "돼지고기", "소고기", "닭고기", "매운 음식", "날음식", "향 강한 음식", "없음"],
  dislike: ["한식", "중식", "일식", "양식", "분식", "패스트푸드", "마라", "치킨", "피자", "햄버거", "국물류", "고기류", "해산물", "채소 위주 음식", "디저트류", "없음"],
  preference: ["한식", "중식", "일식", "양식", "분식", "치킨", "피자", "햄버거", "고기/구이", "샤브샤브", "마라/훠궈", "국밥/해장국", "카페 브런치", "디저트", "샐러드/다이어트식", "야식류"]
};

const menus = [
  { name: "김치볶음밥", category: "한식", spicy: 2, tags: ["돼지고기"] },
  { name: "돈까스", category: "일식", spicy: 1, tags: ["돼지고기"] },
  { name: "초밥", category: "일식", spicy: 1, tags: ["생선", "날음식"] },
  { name: "마라탕", category: "중식", spicy: 5, tags: ["마라", "매운 음식"] },
  { name: "파스타", category: "양식", spicy: 1, tags: ["밀가루", "우유/유제품"] },
  { name: "치킨", category: "치킨", spicy: 2, tags: ["닭고기"] },
  { name: "피자", category: "피자", spicy: 1, tags: ["밀가루", "우유/유제품"] },
  { name: "떡볶이", category: "분식", spicy: 4, tags: ["매운 음식"] },
  { name: "샤브샤브", category: "샤브샤브", spicy: 1, tags: ["고기류"] },
  { name: "샐러드", category: "샐러드/다이어트식", spicy: 1, tags: ["채소 위주 음식"] }
];

function go(page) {
  location.href = page;
}

function fakeGoogleLogin() {
  localStorage.setItem("login", "true");

  const profile = localStorage.getItem("profile");
  if (profile) go("main.html");
  else go("profile.html");
}

function createOptions(id, items, max = null) {
  const box = document.getElementById(id);
  if (!box) return;

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = item;

    div.onclick = () => {
      if (max) {
        const selected = box.querySelectorAll(".selected");
        if (!div.classList.contains("selected") && selected.length >= max) {
          alert(`최대 ${max}개까지만 선택할 수 있습니다.`);
          return;
        }
      }
      div.classList.toggle("selected");
    };

    box.appendChild(div);
  });
}

function getSelected(id) {
  return [...document.querySelectorAll(`#${id} .selected`)].map(el => el.innerText);
}

function saveProfile() {
  const profile = {
    name: document.getElementById("name").value || "사용자",
    cannotEat: getSelected("cannotEat"),
    dislike: getSelected("dislike"),
    preference: getSelected("preference"),
    spicy: Number(document.getElementById("spicy").value)
  };

  localStorage.setItem("profile", JSON.stringify(profile));
  alert("프로필이 저장되었습니다.");
  go("main.html");
}

function createRoom() {
  const roomName = document.getElementById("roomName").value || "우리 모임";
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const profile = JSON.parse(localStorage.getItem("profile"));

  const room = {
    roomName,
    inviteCode,
    members: [profile]
  };

  localStorage.setItem("room", JSON.stringify(room));
  go("room.html");
}

function joinRoom() {
  const code = document.getElementById("inviteCode").value;
  const room = JSON.parse(localStorage.getItem("room"));

  if (!room || code !== room.inviteCode) {
    alert("초대코드가 올바르지 않습니다.");
    return;
  }

  const profile = JSON.parse(localStorage.getItem("profile"));
  room.members.push(profile);
  localStorage.setItem("room", JSON.stringify(room));
  go("room.html");
}

function showRoom() {
  const room = JSON.parse(localStorage.getItem("room"));
  if (!room) return;

  document.getElementById("roomTitle").innerText = room.roomName;
  document.getElementById("invite").innerText = room.inviteCode;

  const list = document.getElementById("memberList");
  room.members.forEach(member => {
    const li = document.createElement("li");
    li.innerText = member.name;
    list.appendChild(li);
  });
}

function recommendMenus() {
  const room = JSON.parse(localStorage.getItem("room"));
  const members = room.members;

  const results = menus.map(menu => {
    let score = 0;
    let reason = [];

    for (const member of members) {
      if (member.cannotEat.some(item => menu.tags.includes(item) || menu.category === item)) {
        return null;
      }

      if (member.dislike.includes(menu.category)) {
        score -= 3;
      }

      if (member.preference.includes(menu.category)) {
        score += 5;
        reason.push(`${member.name}님의 선호 음식`);
      }

      if (menu.spicy <= member.spicy) {
        score += 2;
      } else {
        score -= 2;
      }
    }

    return { ...menu, score, reason };
  }).filter(Boolean);

  results.sort((a, b) => b.score - a.score);
  localStorage.setItem("recommend", JSON.stringify(results.slice(0, 3)));
  go("result.html");
}

function showResult() {
  const results = JSON.parse(localStorage.getItem("recommend")) || [];
  const box = document.getElementById("resultBox");

  results.forEach((menu, index) => {
    const div = document.createElement("div");
    div.className = "menu-rank";
    div.innerHTML = `
      <h3>${index + 1}. ${menu.name}</h3>
      <p>종류: ${menu.category}</p>
      <p>매운맛 단계: ${menu.spicy}</p>
      <p>추천 이유: 못 먹는 음식 제외, 선호도와 매운맛 반영</p>
    `;
    box.appendChild(div);
  });
}

function logout() {
  localStorage.clear();
  go("index.html");
}