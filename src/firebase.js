import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 Firebase yapılandırması
// Firebase Console'dan aldığın bilgileri buraya yapıştır
// (Nasıl alacağın README'de anlatılıyor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const firebaseConfig = {
  apiKey: "AIzaSyDqOZzfQjjwsfsnIe4o95mU6CkLEn77kqQ",
  authDomain: "runtobesocial.firebaseapp.com",
  projectId: "runtobesocial",
  storageBucket: "runtobesocial.firebasestorage.app",
  messagingSenderId: "181030402890",
  appId: "1:181030402890:web:08a6c9d6c32f47073c5fb3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── Auth Fonksiyonları ──

export async function registerUser(email, password, name, level) {
  // 1. Firebase'de hesap oluştur
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Profil adını güncelle
  await updateProfile(user, { displayName: name });

  // 3. Firestore'da kullanıcı profili kaydet
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    level,
    avatar: '🏃',
    createdAt: new Date().toISOString(),
    totalRuns: 0,
    totalKm: 0,
  });

  return {
    id: user.uid,
    name,
    email,
    avatar: '🏃',
    level,
  };
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firestore'dan profil bilgilerini al
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};

  return {
    id: user.uid,
    name: user.displayName || userData.name || email.split('@')[0],
    email: user.email,
    avatar: userData.avatar || '🏃',
    level: userData.level || 'Orta Seviye',
  };
}

export async function logoutUser() {
  await signOut(auth);
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        callback({
          id: user.uid,
          name: user.displayName || userData.name || user.email.split('@')[0],
          email: user.email,
          avatar: userData.avatar || '🏃',
          level: userData.level || 'Orta Seviye',
        });
      } catch {
        callback({
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          avatar: '🏃',
          level: 'Orta Seviye',
        });
      }
    } else {
      callback(null);
    }
  });
}

// ── Firebase hata mesajlarını Türkçe'ye çevir ──
export function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla deneme yaptın. Biraz bekle.',
    'auth/network-request-failed': 'İnternet bağlantını kontrol et.',
  };
  return messages[code] || 'Bir hata oluştu. Tekrar dene.';
}

// ── Rota Fonksiyonları ──

export async function createRoute(routeData, userId) {
  const docRef = await addDoc(collection(db, 'routes'), {
    ...routeData,
    userId,
    participants: [userId],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function onRoutesChanged(callback) {
  const q = query(collection(db, 'routes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const routes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(routes);
  });
}

export async function joinRoute(routeId, userId) {
  await updateDoc(doc(db, 'routes', routeId), {
    participants: arrayUnion(userId),
  });
}

// ── Davet Fonksiyonları ──

export async function sendInvite(fromUserId, fromUserName, toUserId, routeId, routeTitle, message) {
  await addDoc(collection(db, 'invites'), {
    from: fromUserId,
    fromName: fromUserName,
    to: toUserId,
    routeId,
    routeTitle,
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export function onInvitesChanged(userId, callback) {
  const q = query(collection(db, 'invites'), where('to', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const invites = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(invites);
  });
}

export async function respondToInvite(inviteId, status) {
  await updateDoc(doc(db, 'invites', inviteId), { status });
}

// ── Kullanıcı Fonksiyonları ──

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function onUsersChanged(callback) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = {};
    snapshot.docs.forEach(d => { users[d.id] = { id: d.id, ...d.data() }; });
    callback(users);
  });
}
