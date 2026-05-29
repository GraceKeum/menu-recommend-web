// 1. Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 💡 Groq API Key
const GROQ_API_KEY = "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";

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

// 화면 이동 함수
function go(page) {
  window.stop();
  location.replace(page);
}

// 회원 인증 상태 감지
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
      localStorage.removeItem("userProfile");
      go("profile.html");
    }
  } catch (error) {
    console.error("로그인 실패:", error);
    alert("구글 로그인에 실패했습니다.");
  }
}

// UI 옵션 생성
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

// 선택된 텍스트 추출
function getSelected(id) {
  return [...document.querySelectorAll(`#${id} .selected`)].map(el => el.innerText);
}

// 기존 유저 프로필 불러오기
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
      try { profile = JSON.parse(storedProfile); } catch (e) { console.error("로컬 프로필 파싱 실패:", e); }
    }
  }
  return profile;
}

// 프로필 폼에 기존 정보 채우기
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

// 5. Firestore에 프로필 저장
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

// 6. Firestore에 모임방 만들고 저장
async function createRoom() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("로그인이 필요합니다.");
    go("index.html");
    return;
  }

  let userProfile = null;
  try { userProfile = JSON.parse(localStorage.getItem("userProfile")); } catch (e) { console.error(e); }
  if (!userProfile) userProfile = await loadUserProfile();

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

// 내가 참여한 방 목록 가져오기
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
      roomList.innerHTML = "<li>참여 중인 모임이 없습니다.</li>";
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

// 모임 목록 패널 토글
async function toggleRoomList() {
  const roomPanel = document.getElementById("roomPanel");
  const toggleBtn = document.getElementById("toggleRoomListBtn");
  if (!roomPanel) return;

  if (roomPanel.classList.contains("hidden")) {
    roomPanel.classList.remove("hidden");
    await loadMyRooms();
    if (toggleBtn) toggleBtn.textContent = "목록 숨기기";
  } else {
    roomPanel.classList.add("hidden");
    if (toggleBtn) toggleBtn.textContent = "모임 목록 보기";
  }
}

// 7. 초대코드로 Firestore 방 찾아서 참여하기
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

// 8. 대기방 정보 실시간 감시
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

// 방 나가기 기능
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

// 🤖 Groq AI 메뉴 추천 로직
async function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!members || members.length === 0) return alert("참여한 멤버가 없습니다.");

  localStorage.setItem("recommend_loading", "true");
  localStorage.removeItem("recommend_text");

  let membersSummary = "";
  members.forEach((m, idx) => {
    const cannotEatList = Array.isArray(m.cannotEat) && m.cannotEat.length > 0 ? m.cannotEat.join(",") : "없음";
    const dislikeList = Array.isArray(m.dislike) && m.dislike.length > 0 ? m.dislike.join(",") : "없음";
    const preferenceList = Array.isArray(m.preference) && m.preference.length > 0 ? m.preference.join(",") : "상관없음";
    membersSummary += `M${idx+1}:못먹는[${cannotEatList}],싫어하는[${dislikeList}],선호[${preferenceList}],매운맛[${m.spicy||1}]\n`;
  });

  const promptMessage = `
    다음 유저 취향 분석 후 점심/저녁 메뉴 3개 추천해줘.
    ${membersSummary}
    [규칙]
    1. 인사말, 안내멘트 절대 금지. 오직 결과만 포맷대로 출력할 것.
    2. 추천이유에 유저의 실제 고유 이름을 적지마라. '멤버들'로 퉁쳐라.
    3. 아래 포맷을 무조건 준수해라. 숫자와 위 형태(1위, 2위, 3위)로 작성해라.

    1위: [메뉴명]
    추천 이유: [한줄설명]
    2위: [메뉴명]
    추천 이유: [한줄설명]
    3위: [메뉴명]
    추천 이유: [한줄설명]
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptMessage }],
        temperature: 0.9,
        max_tokens: 600
      })
    });

    const data = await response.json();
    console.log("Groq 원본 데이터:", data);

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      localStorage.setItem("recommend_text", data.choices[0].message.content);
    } else if (data.error) {
      localStorage.setItem("recommend_text", `Groq 서버 에러: ${data.error.message}`);
    } else {
      localStorage.setItem("recommend_text", "AI 통신은 성공했으나 답변 형식을 읽지 못했습니다.");
    }

  } catch (error) {
    console.error("Groq API 호출 실패:", error);
    localStorage.setItem("recommend_text", "네트워크 오류가 발생했습니다.");
  } finally {
    localStorage.removeItem("recommend_loading");
    go("result.html"); // ✅ API 완료 후 페이지 이동
  }
}

// 🛠️ 결과 UI 출력 로직
function showResult() {
  const box = document.getElementById("resultBox");
  if (!box) return;

  const isLoading = localStorage.getItem("recommend_loading");
  const aiText = localStorage.getItem("recommend_text");

  box.innerHTML = "";

  if (isLoading === "true") {
    box.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: #ff5a75; font-weight: bold;">
        <p style="font-size: 24px; margin-bottom: 10px;">🧐 🤖 ✨</p>
        <p>모든 멤버의 취향과 알레르기를 분석하여<br>AI가 최고의 메뉴를 조율하는 중입니다...</p>
      </div>
    `;
    return;
  }

  if (!aiText) {
    box.innerHTML = `<p style="text-align:center; color:#aaa; padding: 20px;">추천된 결과가 없습니다. 방에서 다시 추천 버튼을 눌러주세요.</p>`;
    return;
  }

  if (aiText.includes("Groq 서버 에러") || aiText.includes("Rate limit")) {
    const errBox = document.createElement("div");
    errBox.style.cssText = `
      padding: 20px; background: #fff5f7; border-radius: 12px;
      border: 1px solid #ffd0d8; color: #ff5a75; font-size: 14px; line-height: 1.6; text-align:center;
    `;
    errBox.innerHTML = `🚨 <b>AI 호출 제한에 걸렸습니다!</b><br>Groq 무료 서버 제한 때문에 일시적으로 멈췄습니다.<br>안전을 위해 <b>3초 후</b> 다시 버튼을 눌러주세요.`;
    box.appendChild(errBox);
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const ranks = ["1위", "2위", "3위"];
  const colors = ["#fff9e6", "#f5f5f5", "#fff3ec"];
  const borders = ["#ffc107", "#bbbbbb", "#ff8c42"];

  const blocks = aiText.split(/(?=\b[123](?:위|\.))/).filter(s => s.trim());
  let cardCount = 0;

  blocks.forEach((block) => {
    if (cardCount >= 3) return;

    const rankMatch = block.match(/([123])(?:위|\.)/);
    if (!rankMatch) return;

    const rankIdx = parseInt(rankMatch[1]) - 1;

    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    let menuName = "추천 메뉴";
    let reason = "";

    if (lines.length > 0) {
      menuName = lines[0].replace(/^[123](?:위|\.)\s*[:：\-]?\s*/, "").trim();
      menuName = menuName.replace(/[\[\]]/g, "");
    }

    const reasonLineIdx = lines.findIndex(l => l.includes("추천 이유") || l.includes("추천이유"));
    if (reasonLineIdx !== -1) {
      reason = lines.slice(reasonLineIdx).join(" ").replace(/^추천\s*이유\s*[:：\-]?\s*/, "");
    } else if (lines.length > 1) {
      reason = lines.slice(1).join(" ");
    } else {
      reason = "멤버들의 취향과 알레르기 유무를 고려하여 추천된 최적의 선택입니다.";
    }

    reason = reason.replace(/[\[\]]/g, "").trim();

    const card = document.createElement("div");
    card.style.cssText = `
      background: ${colors[rankIdx] || "#fff"};
      border: 2px solid ${borders[rankIdx] || "#eee"};
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      text-align: left;
    `;

    card.innerHTML = `
      <div style="font-size: 12px; color: #999; margin-bottom: 6px; font-weight: 600; letter-spacing: 1px;">${medals[rankIdx] || "✨"} ${ranks[rankIdx] || ""}</div>
      <div style="font-size: 22px; font-weight: bold; color: #222; margin-bottom: 10px;">${menuName}</div>
      <div style="font-size: 14px; color: #666; line-height: 1.7; border-top: 1px solid ${borders[rankIdx] || "#eee"}; padding-top: 10px;">${reason}</div>
    `;
    box.appendChild(card);
    cardCount++;
  });

  if (cardCount === 0) {
    const container = document.createElement("div");
    container.style.cssText = `
      white-space: pre-wrap; line-height: 1.7; padding: 25px;
      background: #fdfdfd; border-radius: 16px; text-align: left;
      border: 1px solid #e0e0e0; color: #333; font-size: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    `;
    container.innerText = aiText;
    box.appendChild(container);
  }
}

// 로그아웃
async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("userProfile");
    localStorage.removeItem("currentRoomCode");
    localStorage.removeItem("roomMembers");
    localStorage.removeItem("recommend_text");
    go("index.html");
  } catch (e) {
    console.error("로그아웃 실패:", e);
    alert("로그아웃에 실패했습니다.");
  }
}

// 외부 HTML 버튼용 전역 객체 등록
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

// 버튼 이벤트 직접 등록
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnRecommend");
  if (btn) btn.addEventListener("click", recommendMenus);
});