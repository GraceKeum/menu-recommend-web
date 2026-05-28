// 1. Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsP5clLaaCjosivSajF7gHruXrzsWg6uI",
  authDomain: "menu-f69b6.firebaseapp.com",
  projectId: "menu-f69b6",
  storageBucket: "menu-f69b6.firebasestorage.app",
  messagingSenderId: "928271483016",
  appId: "1:928271483016:web:bbe263d724c55a31fe5f3d",
  measurementId: "G-31Z5285C6X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (typeof populateProfileForm === 'function') {
      try {
        await populateProfileForm();
      } catch (e) {
        console.error('Auth state profile load 실패:', e);
      }
    }
  }
});

async function ensureCurrentUser() {
  if (auth.currentUser) return auth.currentUser;
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

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

function go(page) {
  window.stop();
  location.replace(page);
}

async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      localStorage.setItem("userProfile", JSON.stringify(userDoc.data()));
      go("main.html");
    } else {
      localStorage.removeItem("userProfile");
      go("profile.html");
    }
  } catch (error) {
    console.error("로그인 실패:", error);
    alert("구글 로그인에 실패했습니다.");
  }
}

function createOptions(id, items, max = null, selectedItems = []) {
  const box = document.getElementById(id);
  if (!box) return;

  box.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = item;

    if (selectedItems.includes(item)) {
      div.classList.add("selected");
    }

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

async function loadUserProfile() {
  let profile = null;

  if (auth.currentUser) {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        profile = userDoc.data();
        localStorage.setItem("userProfile", JSON.stringify(profile));
      } else {
        localStorage.removeItem("userProfile");
      }
    } catch (e) {
      console.error("Firestore에서 프로필 로드 실패:", e);
    }
  }

  if (!profile) {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      try {
        profile = JSON.parse(storedProfile);
      } catch (e) {
        console.error("로컬 프로필 파싱 실패:", e);
      }
    }
  }

  return profile;
}

async function populateProfileForm() {
  const profile = await loadUserProfile();

  const nameInput = document.getElementById("name");
  const ageInput = document.getElementById("age");
  const genderSelect = document.getElementById("gender");
  const spicyInput = document.getElementById("spicy");

  if (nameInput) nameInput.value = profile?.name || "";
  if (ageInput) ageInput.value = profile?.age || "";
  if (genderSelect) {
    genderSelect.value = profile?.gender || "";
    genderSelect.style.color = profile?.gender ? "#333" : "#aaa";
  }
  if (spicyInput) spicyInput.value = profile?.spicy || 3;

  createOptions("cannotEat", foodOptions.cannotEat, null, profile?.cannotEat || []);
  createOptions("dislike", foodOptions.dislike, null, profile?.dislike || []);
  createOptions("preference", foodOptions.preference, 3, profile?.preference || []);
}

async function saveProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("로그인이 필요합니다.");
    return;
  }

  const profile = {
    name: document.getElementById("name")?.value || currentUser.displayName || "사용자",
    age: Number(document.getElementById("age")?.value) || null,
    gender: document.getElementById("gender")?.value || "",
    cannotEat: getSelected("cannotEat"),
    dislike: getSelected("dislike"),
    preference: getSelected("preference"),
    spicy: Number(document.getElementById("spicy")?.value || 3),
    uid: currentUser.uid
  };

  try {
    await setDoc(doc(db, "users", currentUser.uid), profile);
    localStorage.setItem("userProfile", JSON.stringify(profile));
    alert("프로필이 클라우드에 저장되었습니다.");
    go("main.html");
  } catch (e) {
    console.error("프로필 저장 실패:", e);
    alert("프로필 저장에 실패했습니다.");
  }
}

async function createRoom() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("로그인이 필요합니다.");
    go("index.html");
    return;
  }

  let userProfile = null;
  try {
    userProfile = JSON.parse(localStorage.getItem("userProfile"));
  } catch (e) {
    console.error("로컬 프로필 파싱 실패:", e);
  }

  if (!userProfile) {
    userProfile = await loadUserProfile();
  }

  if (!userProfile) {
    alert("프로필 정보가 없습니다. 프로필을 먼저 작성해주세요.");
    go("profile.html");
    return;
  }

  const roomName = document.getElementById("roomName")?.value || "우리 모임";
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
    alert("모임방 생성에 실패했습니다.");
  }
}

async function loadMyRooms() {
  const currentUser = auth.currentUser || await ensureCurrentUser();
  if (!currentUser) return;

  try {
    const roomList = document.getElementById("myRoomList");
    if (!roomList) return;

    roomList.innerHTML = "<li>로딩 중...</li>";

    const querySnapshot = await getDocs(collection(db, "rooms"));
    const rooms = [];

    querySnapshot.forEach(docSnap => {
      const roomData = docSnap.data();
      if (Array.isArray(roomData.members) && roomData.members.some(member => member.uid === currentUser.uid)) {
        rooms.push({ id: docSnap.id, ...roomData });
      }
    });

    roomList.innerHTML = "";
    if (rooms.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.innerText = "참여 중인 모임이 없습니다.";
      roomList.appendChild(emptyItem);
      return;
    }

    rooms.forEach(room => {
      const item = document.createElement("li");
      item.className = "room-item";
      item.innerHTML = `
        <div class="room-info">
          <strong>${room.roomName}</strong>
          <span>${room.inviteCode}</span>
        </div>
      `;

      const enterButton = document.createElement("button");
      enterButton.textContent = "입장";
      enterButton.onclick = () => {
        localStorage.setItem("currentRoomCode", room.inviteCode);
        go("room.html");
      };
      item.appendChild(enterButton);
      roomList.appendChild(item);
    });
  } catch (e) {
    console.error("내 모임 불러오기 실패:", e);
  }
}

async function toggleRoomList() {
  const roomPanel = document.getElementById("roomPanel");
  const toggleBtn = document.getElementById("toggleRoomListBtn");
  if (!roomPanel) return;

  if (roomPanel.classList.contains("hidden")) {
    roomPanel.classList.remove("hidden");
    if (typeof loadMyRooms === 'function') {
      await loadMyRooms();
    }
    if (toggleBtn) toggleBtn.textContent = "목록 숨기기";
  } else {
    roomPanel.classList.add("hidden");
    if (toggleBtn) toggleBtn.textContent = "모임 목록 보기";
  }
}

async function joinRoom() {
  const inviteCodeInput = document.getElementById("inviteCode");
  if (!inviteCodeInput) return;

  const code = inviteCodeInput.value.toUpperCase().trim();
  if (!code) return alert("초대코드를 입력하세요.");

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
    const roomData = roomDoc.data();
    const roomRef = doc(db, "rooms", roomDoc.id);

    const isAlreadyMember = Array.isArray(roomData.members) && roomData.members.some(member => member.uid === userProfile.uid);
    if (!isAlreadyMember) {
      await updateDoc(roomRef, {
        members: arrayUnion(userProfile)
      });
    }

    localStorage.setItem("currentRoomCode", code);
    go("room.html");
  } catch (e) {
    console.error("방 참여 실패:", e);
    alert("모임 참여에 실패했습니다.");
  }
}

function showRoom() {
  const currentCode = localStorage.getItem("currentRoomCode");
  if (!currentCode) {
    alert("현재 대기방 정보가 없습니다.");
    go("main.html");
    return;
  }

  const q = query(collection(db, "rooms"), where("inviteCode", "==", currentCode));

  onSnapshot(q, (querySnapshot) => {
    if (querySnapshot.empty) return;

    const roomDoc = querySnapshot.docs[0];
    const roomData = roomDoc.data();

    const roomTitleEl = document.getElementById("roomTitle");
    const inviteEl = document.getElementById("invite");
    if (roomTitleEl) roomTitleEl.innerText = roomData.roomName || "모임방";
    if (inviteEl) inviteEl.innerText = roomData.inviteCode || currentCode;

    const list = document.getElementById("memberList");
    if (list) {
      list.innerHTML = "";
      (roomData.members || []).forEach(member => {
        const li = document.createElement("li");
        li.innerText = member.name || "익명";
        list.appendChild(li);
      });
    }

    localStorage.setItem("roomMembers", JSON.stringify(roomData.members || []));
  });
}

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

function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!Array.isArray(members) || members.length === 0) return alert("참여한 멤버가 없습니다.");

  const results = menus.map(menu => {
    let score = 0;
    let reason = [];

    for (const member of members) {
      if (member.cannotEat && member.cannotEat.some(item => menu.tags.includes(item) || menu.category === item)) {
        return null;
      }
      if (member.dislike && member.dislike.includes(menu.category)) {
        score -= 3;
      }
      if (member.preference && member.preference.includes(menu.category)) {
        score += 5;
        reason.push(`${member.name}님의 선호 음식`);
      }
      if (typeof member.spicy === "number") {
        if (menu.spicy <= member.spicy) {
          score += 2;
        } else {
          score -= 2;
        }
      }
    }

    return { ...menu, score, reason };
  }).filter(Boolean);

  if (results.length === 0) {
    alert("조건에 맞는 메뉴가 없습니다.");
    return;
  }

  results.sort((a, b) => b.score - a.score);
  localStorage.setItem("recommend", JSON.stringify(results.slice(0, 3)));
  go("result.html");
}

function showResult() {
  const results = JSON.parse(localStorage.getItem("recommend")) || [];
  const box = document.getElementById("resultBox");
  if (!box) return;

  box.innerHTML = "";

  if (results.length === 0) {
    box.innerHTML = "<p>추천 결과가 없습니다.</p>";
    return;
  }

  results.forEach((menu, index) => {
    const div = document.createElement("div");
    div.className = "menu-rank";
    const reasonText = menu.reason && menu.reason.length > 0
      ? menu.reason.join(", ")
      : "못 먹는 음식 제외, 선호도와 매운맛을 반영했습니다.";

    div.innerHTML = `
      <h3>${index + 1}. ${menu.name}</h3>
      <p>종류: ${menu.category}</p>
      <p>매운맛 단계: ${menu.spicy}</p>
      <p>추천 이유: ${reasonText}</p>
    `;
    box.appendChild(div);
  });
}

async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("userProfile");
    localStorage.removeItem("currentRoomCode");
    localStorage.removeItem("roomMembers");
    localStorage.removeItem("recommend");
    go("index.html");
  } catch (e) {
    console.error("로그아웃 실패:", e);
    alert("로그아웃에 실패했습니다.");
  }
}

window.go = go;
window.googleLogin = googleLogin;
window.logout = logout;
window.createOptions = createOptions;
window.saveProfile = saveProfile;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.showRoom = showRoom;
window.recommendMenus = recommendMenus;
window.showResult = showResult;
window.leaveRoom = leaveRoom;
window.populateProfileForm = populateProfileForm;
window.loadMyRooms = loadMyRooms;
window.toggleRoomList = toggleRoomList;
window.foodOptions = foodOptions;
