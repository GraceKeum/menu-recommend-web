// 1. Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyDsP5clLaaCjosivSajF7gHruXrzsWg6uI",
  authDomain: "menu-f69b6.firebaseapp.com",
  projectId: "menu-f69b6",
  storageBucket: "menu-f69b6.firebasestorage.app",
  messagingSenderId: "928271483016",
  appId: "1:928271483016:web:bbe263d724c55a31fe5f3d",
  measurementId: "G-31Z5285C6X"
};

// 3. Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// 데이터셋
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

// 페이지 이동 함수
function go(page) {
  location.href = page;
}

// 4. 구글 로그인 및 프로필 분기 처리
async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // 유저가 기존에 프로필을 짰는지 확인
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      // 이미 프로필이 있으면 로컬에 저장하고 메인으로
      localStorage.setItem("userProfile", JSON.stringify(userDoc.data()));
      go("main.html");
    } else {
      // 프로필이 처음이면 설정 페이지로 이동
      go("profile.html");
    }
  } catch (error) {
    console.error("로그인 실패:", error);
    alert("구글 로그인에 실패했습니다.");
  }
}

// 5. UI 옵션 생성 (기존 코드 유지)
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

// 6. Firestore 및 로컬에 프로필 저장
async function saveProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("로그인이 필요합니다.");
    return;
  }

  const profile = {
    uid: currentUser.uid,
    name: document.getElementById("name").value || currentUser.displayName || "사용자",
    cannotEat: getSelected("cannotEat"),
    dislike: getSelected("dislike"),
    preference: getSelected("preference"),
    spicy: Number(document.getElementById("spicy").value)
  };

  try {
    // Firestore의 'users' 컬렉션에 내 uid 이름으로 저장
    await setDoc(doc(db, "users", currentUser.uid), profile);
    localStorage.setItem("userProfile", JSON.stringify(profile)); // 연산용 로컬 백업
    alert("프로필이 클라우드에 저장되었습니다.");
    go("main.html");
  } catch (e) {
    console.error("프로필 저장 실패:", e);
    alert("프로필 저장에 실패했습니다.");
  }
}

// [수정 완료] 7. 모임방 만들기 (화면에 코드 유지를 위해 자동이동을 제거하고 코드를 return)
async function createRoom() {
  const currentUser = auth.currentUser;
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));
  if (!userProfile) {
    alert("프로필 정보가 없습니다. 프로필을 먼저 설정해주세요.");
    return null;
  }

  const roomNameInput = document.getElementById("roomName");
  const roomName = roomNameInput ? (roomNameInput.value.trim() || "우리 모임") : "우리 모임";
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const roomData = {
    roomName,
    inviteCode,
    creator: currentUser.uid,
    members: [userProfile] // 방장 프로필을 먼저 멤버에 포함
  };

  try {
    await addDoc(collection(db, "rooms"), roomData);
    localStorage.setItem("currentRoomCode", inviteCode); // 대기방 입장 시 식별용
    return inviteCode; // 중요: HTML 내부 스크립트로 초대코드를 반환하여 화면에 띄웁니다.
  } catch (e) {
    console.error("방 생성 실패:", e);
    alert("방 생성에 실패했습니다.");
    return null;
  }
}

// 8. 초대코드로 진짜 Firestore 방 찾아서 참여하기
async function joinRoom() {
  const inviteCodeInput = document.getElementById("inviteCode");
  if (!inviteCodeInput) return;

  const code = inviteCodeInput.value.toUpperCase();
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));
  if (!userProfile) return alert("프로필이 필요합니다.");

  try {
    const q = query(collection(db, "rooms"), where("inviteCode", "==", code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("올바르지 않은 초대코드입니다.");
      return;
    }

    const roomDoc = querySnapshot.docs[0];
    const roomRef = doc(db, "rooms", roomDoc.id);
    const roomData = roomDoc.data();

    // 중복 참여 방지 로직 추가
    const isAlreadyMember = roomData.members.some(member => member.uid === userProfile.uid);
    if (!isAlreadyMember) {
      await updateDoc(roomRef, {
        members: arrayUnion(userProfile)
      });
    }

    localStorage.setItem("currentRoomCode", code);
    go("room.html");
  } catch (e) {
    console.error("방 참여 실패:", e);
    alert("방 참여에 실패했습니다.");
  }
}

// 9. 대기방 정보 실시간/연동 출력
async function showRoom() {
  const currentCode = localStorage.getItem("currentRoomCode");
  if (!currentCode) return;

  try {
    const q = query(collection(db, "rooms"), where("inviteCode", "==", currentCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const roomData = querySnapshot.docs[0].data();
    
    // 화면 바인딩
    const roomTitleEl = document.getElementById("roomTitle");
    const inviteEl = document.getElementById("invite");
    if (roomTitleEl) roomTitleEl.innerText = roomData.roomName;
    if (inviteEl) inviteEl.innerText = roomData.inviteCode;

    const list = document.getElementById("memberList");
    if (list) {
      list.innerHTML = ""; // 초기화
      roomData.members.forEach(member => {
        const li = document.createElement("li");
        li.innerText = member.name;
        list.appendChild(li);
      });
    }
    
    localStorage.setItem("roomMembers", JSON.stringify(roomData.members));
  } catch (e) {
    console.error("방 정보 로드 실패:", e);
  }
}

// 10. 추천 메뉴 알고리즘
function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!members || members.length === 0) return alert("참여한 멤버가 없습니다.");

  const results = menus.map(menu => {
    let score = 0;
    let reason = [];

    for (const member of members) {
      // 못 먹는 음식이 걸리면 제외
      if (member.cannotEat && member.cannotEat.some(item => menu.tags.includes(item) || menu.category === item)) {
        return null;
      }
      // 비선호 감점
      if (member.dislike && member.dislike.includes(menu.category)) {
        score -= 3;
      }
      // 선호 가점 및 이유 수집
      if (member.preference && member.preference.includes(menu.category)) {
        score += 5;
        reason.push(`${member.name}님의 선호 음식`);
      }
      // 매운맛 반영
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

// [수정 완료] 11. 결과 화면 출력 (동적으로 수집된 실제 사유 연동)
function showResult() {
  const results = JSON.parse(localStorage.getItem("recommend")) || [];
  const box = document.getElementById("resultBox");
  if (!box) return;

  box.innerHTML = ""; // 초기화
  results.forEach((menu, index) => {
    const div = document.createElement("div");
    div.className = "menu-rank";

    // 동적 사유가 존재하면 쉼표로 연결해서 보여주고, 비어있으면 기본 문구를 보여줌
    const reasonText = menu.reason && menu.reason.length > 0 
      ? menu.reason.join(", ") 
      : "못 먹는 음식 제외, 멤버들의 무난한 선호도와 매운맛 수용도 반영";

    div.innerHTML = `
      <h3>${index + 1}. ${menu.name}</h3>
      <p>종류: ${menu.category}</p>
      <p>매운맛 단계: ${menu.spicy}</p>
      <p>추천 이유: ${reasonText}</p>
    `;
    box.appendChild(div);
  });
}

// 12. 진짜 로그아웃
async function logout() {
  try {
    await signOut(auth);
    localStorage.clear();
    go("index.html");
  } catch (e) {
    console.error("로그아웃 실패:", e);
  }
}

// 외부 HTML 인라인 스크립트(onclick 등)에서 호출할 수 있도록 window 객체에 등록
window.go = go;
window.googleLogin = googleLogin;
window.createOptions = createOptions;
window.saveProfile = saveProfile;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.showRoom = showRoom;
window.recommendMenus = recommendMenus;
window.showResult = showResult;
window.logout = logout;
window.foodOptions = foodOptions;