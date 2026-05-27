// 1. Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

// 화면 이동 함수 (렉 방지 로직 추가)
function go(page) {
  window.stop(); // 무거운 파이어베이스 다운로드 스트림을 즉시 끊어버림
  location.replace(page); // 잔여 메모리를 지우며 안전하게 이동
}

// 4. 구글 로그인 함수
async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      localStorage.setItem("userProfile", JSON.stringify(userDoc.data()));
      go("main.html");
    } else {
      go("profile.html");
    }
  } catch (error) {
    console.error("로그인 실패:", error);
    alert("구글 로그인에 실패했습니다.");
  }
}

// UI 옵션 생성
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

// 5. Firestore에 프로필 저장
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
    await setDoc(doc(db, "users", currentUser.uid), profile);
    localStorage.setItem("userProfile", JSON.stringify(profile));
    alert("프로필이 클라우드에 저장되었습니다.");
    go("main.html");
  } catch (e) {
    console.error("프로필 저장 실패:", e);
  }
}

// 6. Firestore에 모임방 만들고 저장
async function createRoom() {
  const currentUser = auth.currentUser;
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));
  if (!userProfile) return alert("프로필 정보가 없습니다.");

  const roomName = document.getElementById("roomName").value || "우리 모임";
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const roomData = {
    roomName,
    inviteCode,
    creator: currentUser.uid,
    members: [userProfile]
  };

  try {
    await addDoc(collection(db, "rooms"), roomData);
    localStorage.setItem("currentRoomCode", inviteCode);
    go("room.html");
  } catch (e) {
    console.error("방 생성 실패:", e);
  }
}

// 7. 초대코드로 진짜 Firestore 방 찾아서 참여하기
async function joinRoom() {
  const code = document.getElementById("inviteCode").value.toUpperCase();
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

    await updateDoc(roomRef, {
      members: arrayUnion(userProfile)
    });

    localStorage.setItem("currentRoomCode", code);
    go("room.html");
  } catch (e) {
    console.error("방 참여 실패:", e);
  }
}

// 8. 대기방 정보 실시간/연동 출력
async function showRoom() {
  const currentCode = localStorage.getItem("currentRoomCode");
  if (!currentCode) return;

  try {
    const q = query(collection(db, "rooms"), where("inviteCode", "==", currentCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const roomData = querySnapshot.docs[0].data();
    
    document.getElementById("roomTitle").innerText = roomData.roomName;
    document.getElementById("invite").innerText = roomData.inviteCode;

    const list = document.getElementById("memberList");
    list.innerHTML = "";
    
    roomData.members.forEach(member => {
      const li = document.createElement("li");
      li.innerText = member.name;
      list.appendChild(li);
    });
    
    localStorage.setItem("roomMembers", JSON.stringify(roomData.members));
  } catch (e) {
    console.error("방 정보 로드 실패:", e);
  }
}

// 추천 메뉴 알고리즘
function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!members) return alert("참여한 멤버가 없습니다.");

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
  if(!box) return;

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

// 로그아웃
async function logout() {
  await signOut(auth);
  localStorage.clear();
  go("index.html");
}

// 외부 HTML 버튼용 전역 객체(window) 등록 등록 완료 (오타 수정됨)
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
window.go = go;