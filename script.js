// 1. Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 선택된 텍스트 추출
function getSelected(id) {
  const selectedItems = [...document.querySelectorAll(`#${id} .selected`)].map(el => el.innerText);
  if (selectedItems.includes("없음") || selectedItems.length === 0) {
    return [];
  }
  return selectedItems;
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
    spicy: Number(document.getElementById("spicy").value) || 1
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

// 8. 대기방 정보 실시간 출력
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

// 🤖 Groq 메뉴 추천 로직
async function recommendMenus() {
  const members = JSON.parse(localStorage.getItem("roomMembers"));
  if (!members || members.length === 0) return alert("참여한 멤버가 없습니다.");

  localStorage.setItem("recommend_loading", "true");
  localStorage.removeItem("recommend_text");
  
  let membersSummary = "";
  members.forEach((m, idx) => {
    const cannotEatList = Array.isArray(m.cannotEat) && m.cannotEat.length > 0 ? m.cannotEat.join(", ") : "없음";
    const dislikeList = Array.isArray(m.dislike) && m.dislike.length > 0 ? m.dislike.join(", ") : "없음";
    const preferenceList = Array.isArray(m.preference) && m.preference.length > 0 ? m.preference.join(", ") : "상관없음";

    membersSummary += `
    [멤버 ${idx + 1}]
    - 이름: ${m.name || "익명"}
    - 절대 못 먹는 음식: ${cannotEatList}
    - 싫어하는 음식: ${dislikeList}
    - 선호 카테고리: ${preferenceList}
    - 매운맛 선호도(1~5): ${m.spicy || 1}단계
    `;
  });

  const promptMessage = `
    다음은 하나의 모임방에 모인 사람들의 프로필과 음식 취향 리스트야. 
    이 모든 사람들의 취향을 종합적으로 고려해서 오늘 다 같이 먹기 좋은 점심/저녁 메뉴 3가지를 추천하고 구체적인 이유를 설명해줘.
    
    ${membersSummary}
    
    [출력 및 추천 규칙]
    1. 멤버 정보 중 '절대 못 먹는 음식'이 '없음'이 아니라 진짜 특정 음식이 적혀있다면, 해당 재료나 카테고리는 절대로 추천 메뉴에 포함되면 안 돼.
    2. '싫어하는 음식'도 최대한 피하되, 전체 멤버가 조화롭게 먹을 수 있는 최적의 메뉴를 찾아줘.
    3. 각 멤버들의 매운맛 선호도를 고려해서 너무 맵거나 너무 밋밋하지 않은 메뉴들로 구성해줘.
    4. 친근하고 위트 있는 톤앤매너로 답변해줘.
    5. 출력 포맷은 반드시 아래 형식을 정확히 지켜줘. (HTML 태그나 마크다운 기호 없이 순수한 텍스트와 줄바꿈으로만 출력해줘)
    6. 멤버 이름, 알레르기, 취향 등 멤버 개인 정보는 절대 출력하지 마.
    7. 쓸데없는 말 출력하지 말고, 메뉴와 이유만 출력해.
    8. 이유에 멤버 누구가 괜찮다는 식의 불필요한 말은 빼줘.
    9. 멤버 이름은 이유에서 빼줘.
    
    🥇 1위: [메뉴 이름]
    추천 이유: [한 줄 설명]
    
    🥈 2위: [메뉴 이름]
    추천 이유: [한 줄 설명]
    
    🥉 3위: [메뉴 이름]
    추천 이유: [한 줄 설명]
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: promptMessage }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    console.log("Groq 원본 데이터:", data);

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      localStorage.setItem("recommend_text", data.choices[0].message.content);
    } else if (data.error) {
      localStorage.setItem("recommend_text", `Groq 서버 에러: ${data.error.message}`);
    } else {
      localStorage.setItem("recommend_text", "AI 통신은 성공했으나 답변 형식을 읽지 못했습니다. 다시 시도해 주세요!");
    }

  } catch (error) {
    console.error("Groq API 호출 실패:", error);
    localStorage.setItem("recommend_text", "네트워크 통신 중 오류가 발생했습니다. API 키를 확인해 주세요.");
  } finally {
    localStorage.removeItem("recommend_loading");
    go("result.html");
  }
}

// 결과 출력 (카드 UI)
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
  } else if (aiText) {

    const medals = ["🥇", "🥈", "🥉"];
    const ranks = ["1위", "2위", "3위"];
    const colors = ["#fff9e6", "#f5f5f5", "#fff3ec"];
    const borders = ["#ffc107", "#bbbbbb", "#ff8c42"];

    // 🥇 🥈 🥉 기준으로 블록 분리
    const blocks = aiText.split(/(?=🥇|🥈|🥉)/).filter(s => s.trim());

    if (blocks.length === 3) {
      blocks.forEach((block, i) => {
        const menuMatch = block.match(/[🥇🥈🥉]\s*\d위\s*[:：]\s*(.+)/);
        const reasonMatch = block.match(/추천 이유\s*[:：]\s*([\s\S]+)/);

        const menuName = menuMatch ? menuMatch[1].trim() : "메뉴";
        const reason = reasonMatch ? reasonMatch[1].trim() : block.trim();

        const card = document.createElement("div");
        card.style.cssText = `
          background: ${colors[i]};
          border: 2px solid ${borders[i]};
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        `;

        card.innerHTML = `
          <div style="font-size: 12px; color: #999; margin-bottom: 6px; font-weight: 600; letter-spacing: 1px;">${medals[i]} ${ranks[i]}</div>
          <div style="font-size: 22px; font-weight: bold; color: #222; margin-bottom: 10px;">${menuName}</div>
          <div style="font-size: 14px; color: #666; line-height: 1.7; border-top: 1px solid ${borders[i]}; padding-top: 10px;">${reason}</div>
        `;

        box.appendChild(card);
      });

    } else {
      // 파싱 실패 시 기존 방식으로 폴백
      const container = document.createElement("div");
      container.style.cssText = `
        white-space: pre-wrap; line-height: 1.7; padding: 20px;
        background: #fff5f7; border-radius: 12px;
        border: 1px solid #ffd0d8; color: #333; font-size: 16px;
      `;
      container.innerText = aiText;
      box.appendChild(container);
    }

  } else {
    box.innerHTML = `<p style="text-align:center; color:#aaa;">추천된 결과가 없습니다. 방에서 다시 추천 버튼을 눌러주세요.</p>`;
  }
}

// 로그아웃
async function logout() {
  await signOut(auth);
  localStorage.clear();
  go("index.html");
}

// 외부 HTML 버튼용 전역 객체(window) 등록
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