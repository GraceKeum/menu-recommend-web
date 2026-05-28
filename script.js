// 1. Firebase 모듈 가져오기 (onSnapshot과 arrayRemove를 상단에 통합했습니다)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
<<<<<<< Updated upstream
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
=======
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
>>>>>>> Stashed changes

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
  cannotEat: ["갑각류", "조개류", "생선", "견과류", "우유 / 유제품", "계란", "밀가루", "돼지고기", "소고기", "닭고기", "매운 음식", "날 음식", "향 강한 음식", "없음"],
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

<<<<<<< Updated upstream
// 5. Firestore에 프로필 저장
=======
// 6. Firestore 및 로컬에 프로필 저장 (기존 로직 그대로 유지)
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// 6. Firestore에 모임방 만들고 저장
=======
let tempProfile = {
  gender: "",
  ageRange: "",
  cannotEat: [],
  dislike: [],
  preference: [],
  spicy: 3
};

function saveStep1_Gender(gender) { tempProfile.gender = gender; }
function saveStep2_Age(age) { tempProfile.ageRange = age; }

async function saveFinalProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return alert("로그인이 필요합니다.");

  const finalProfile = {
    uid: currentUser.uid,
    name: document.getElementById("name")?.value || currentUser.displayName || "사용자",
    gender: tempProfile.gender,
    ageRange: tempProfile.ageRange,
    cannotEat: getSelected("cannotEat"),
    dislike: getSelected("dislike"),
    preference: getSelected("preference"),
    spicy: Number(document.getElementById("spicy")?.value || 3)
  };

  try {
    await setDoc(doc(db, "users", currentUser.uid), finalProfile);
    localStorage.setItem("userProfile", JSON.stringify(finalProfile));
    alert("프로필 설정이 모두 완료되었습니다! 🎉");
    go("main.html");
  } catch (e) {
    console.error("최종 프로필 저장 실패:", e);
  }
}

// 7. 모임방 만들기
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    go("room.html");
=======
    return inviteCode;
>>>>>>> Stashed changes
  } catch (e) {
    console.error("방 생성 실패:", e);
  }
}

// 7. 초대코드로 진짜 Firestore 방 찾아서 참여하기
async function joinRoom() {
<<<<<<< Updated upstream
  const code = document.getElementById("inviteCode").value.toUpperCase();
=======
  const inviteCodeInput = document.getElementById("inviteCode");
  if (!inviteCodeInput) return;

  const code = inviteCodeInput.value.toUpperCase().trim();
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    await updateDoc(roomRef, {
      members: arrayUnion(userProfile)
    });
=======
    const isAlreadyMember = roomData.members.some(member => member.uid === userProfile.uid);
    if (!isAlreadyMember) {
      await updateDoc(roomRef, {
        members: arrayUnion(userProfile)
      });
    }
>>>>>>> Stashed changes

    localStorage.setItem("currentRoomCode", code);
    go("room.html");
  } catch (e) {
    console.error("방 참여 실패:", e);
  }
}

<<<<<<< Updated upstream
// 8. 대기방 정보 실시간/연동 출력
async function showRoom() {
=======
// 9. 대기방 정보 실시간 감시 및 연동 출력
function listenRoom() {
>>>>>>> Stashed changes
  const currentCode = localStorage.getItem("currentRoomCode");
  if (!currentCode) return;

  const q = query(collection(db, "rooms"), where("inviteCode", "==", currentCode));

  onSnapshot(q, (querySnapshot) => {
    if (querySnapshot.empty) return;
    
    const roomDoc = querySnapshot.docs[0];
    const roomData = roomDoc.data();
    
<<<<<<< Updated upstream
    document.getElementById("roomTitle").innerText = roomData.roomName;
    document.getElementById("invite").innerText = roomData.inviteCode;

    const list = document.getElementById("memberList");
    list.innerHTML = "";
    
    roomData.members.forEach(member => {
      const li = document.createElement("li");
      li.innerText = member.name;
      list.appendChild(li);
    });
=======
    const roomTitleEl = document.getElementById("roomTitle");
    const inviteEl = document.getElementById("invite");
    if (roomTitleEl) roomTitleEl.innerText = roomData.roomName;
    if (inviteEl) inviteEl.innerText = roomData.inviteCode;

    const list = document.getElementById("memberList");
    if (list) {
      list.innerHTML = "";
      roomData.members.forEach(member => {
        const li = document.createElement("li");
        li.innerText = `${member.name} 참여완료`; 
        list.appendChild(li);
      });
    }
>>>>>>> Stashed changes
    
    const currentUser = auth.currentUser;
    const recommendBtn = document.getElementById("btnRecommend");
    if (recommendBtn && currentUser) {
      if (roomData.creator === currentUser.uid) {
        recommendBtn.style.display = "block";
      } else {
        recommendBtn.style.display = "none";
      }
    }
    
    localStorage.setItem("roomMembers", JSON.stringify(roomData.members));
  });
}

// [추가] 10. 대기방 나가기 (내가 나가면 대기방 리스트에서 실시간으로 이탈 처리)
async function leaveRoom() {
  const currentCode = localStorage.getItem("currentRoomCode");
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));
  
  if (!currentCode || !userProfile) {
    go("main.html");
    return;
  }

  try {
    const q = query(collection(db, "rooms"), where("inviteCode", "==", currentCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const roomDoc = querySnapshot.docs[0];
      const roomRef = doc(db, "rooms", roomDoc.id);

      // members 배열에서 내 정보만 깔끔하게 제거
      await updateDoc(roomRef, {
        members: arrayRemove(userProfile)
      });
    }

    localStorage.removeItem("currentRoomCode");
    go("main.html");
  } catch (e) {
    console.error("방 나가기 실패:", e);
    go("main.html");
  }
}

<<<<<<< Updated upstream
// 추천 메뉴 알고리즘
=======
// 11. 추천 메뉴 알고리즘
>>>>>>> Stashed changes
function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!members) return alert("참여한 멤버가 없습니다.");

  const results = menus.map(menu => {
    let score = 0;
    let reason = [];

    for (const member of members) {
<<<<<<< Updated upstream
      if (member.cannotEat.some(item => menu.tags.includes(item) || menu.category === item)) {
        return null;
      }
      if (member.dislike.includes(menu.category)) {
        score -= 3;
      }
      if (member.preference.includes(menu.category)) {
=======
      if (member.cannotEat && member.cannotEat.some(item => menu.tags.includes(item) || menu.category === item)) {
        return null;
      }
      if (member.dislike && member.dislike.includes(menu.category)) {
        score -= 3;
      }
      if (member.preference && member.preference.includes(menu.category)) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
// 12. 결과 화면 출력
>>>>>>> Stashed changes
function showResult() {
  const results = JSON.parse(localStorage.getItem("recommend")) || [];
  const box = document.getElementById("resultBox");
  if(!box) return;

<<<<<<< Updated upstream
  results.forEach((menu, index) => {
    const div = document.createElement("div");
    div.className = "menu-rank";
=======
  box.innerHTML = "";
  results.forEach((menu, index) => {
    const div = document.createElement("div");
    div.className = "menu-rank";

    const reasonText = menu.reason && menu.reason.length > 0 
      ? menu.reason.join(", ") 
      : "못 먹는 음식 제외, 멤버들의 무난한 선호도와 매운맛 수용도 반영";

>>>>>>> Stashed changes
    div.innerHTML = `
      <h3>${index + 1}. ${menu.name}</h3>
      <p>종류: ${menu.category}</p>
      <p>매운맛 단계: ${menu.spicy}</p>
      <p>추천 이유: 못 먹는 음식 제외, 선호도와 매운맛 반영</p>
    `;
    box.appendChild(div);
  });
}

<<<<<<< Updated upstream
// 로그아웃
=======
// 13. 로그아웃
>>>>>>> Stashed changes
async function logout() {
  await signOut(auth);
  localStorage.clear();
  go("index.html");
}

<<<<<<< Updated upstream
// 외부 HTML 버튼용 전역 객체(window) 등록 등록 완료 (오타 수정됨)
=======
// 전역 등록 바인딩
>>>>>>> Stashed changes
window.googleLogin = googleLogin;
window.createOptions = createOptions;
window.saveProfile = saveProfile; 

window.saveStep1_Gender = saveStep1_Gender;
window.saveStep2_Age = saveStep2_Age;
window.saveFinalProfile = saveFinalProfile; 

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.listenRoom = listenRoom; 
window.leaveRoom = leaveRoom; // 추가된 방 나가기 전역 바인딩
window.recommendMenus = recommendMenus;
window.showResult = showResult;
window.logout = logout;
window.foodOptions = foodOptions;
window.go = go;