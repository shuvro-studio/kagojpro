import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Invoice, InvoiceItem, ShopProfile, VoiceNote } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import {
  BLUEPRINT_LIMITS,
  clampString,
  sanitizeInvoiceItems,
  sanitizeShopProfile,
} from '../utils/sanitizers';
import { DEFAULT_SHOP_PROFILE } from '../utils/storage';

function timestampToIso(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string') {
    return ts;
  }
  return new Date().toISOString();
}

export async function ensureUserAccountDoc(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const displayName =
        clampString(
          user.displayName || user.email?.split('@')[0] || 'KagojPro User',
          BLUEPRINT_LIMITS.DISPLAY_NAME_MAX
        ) || 'KagojPro User';
      const email =
        clampString(user.email || 'user@example.com', BLUEPRINT_LIMITS.EMAIL_MAX) ||
        'user@example.com';

      await setDoc(ref, {
        uid: user.uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserNotes(
  uid: string,
  onData: (notes: VoiceNote[]) => void
): () => void {
  const path = `users/${uid}/notes`;
  const q = query(collection(db, 'users', uid, 'notes'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: VoiceNote[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ''),
          content: String(data.content || ''),
          speechLang: data.speechLang === 'en-US' ? 'en-US' : 'bn-BD',
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserInvoices(
  uid: string,
  onData: (invoices: Invoice[]) => void
): () => void {
  const path = `users/${uid}/invoices`;
  const q = query(collection(db, 'users', uid, 'invoices'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Invoice[] = snapshot.docs.map((d) => {
        const data = d.data();
        const rawItems = Array.isArray(data.items) ? data.items : [];
        const parsedItems: InvoiceItem[] = rawItems.map((it: Record<string, unknown>, idx: number) => ({
          id: String(it.id || `item-${idx}`),
          name: String(it.name || ''),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        }));

        const theme =
          data.theme === 'thermal' ||
          data.theme === 'modern-blue' ||
          data.theme === 'emerald-boutique'
            ? data.theme
            : 'emerald-boutique';

        return {
          id: d.id,
          invoiceNumber: String(data.invoiceNumber || 'INV-1001'),
          date: String(data.date || new Date().toISOString().slice(0, 10)),
          customerName: String(data.customerName || ''),
          customerPhone: String(data.customerPhone || ''),
          items: parsedItems,
          discount: Number(data.discount) || 0,
          deliveryCharge: Number(data.deliveryCharge) || 0,
          status: data.status === 'DUE' ? 'DUE' : 'PAID',
          paidAmount: Number(data.paidAmount) || 0,
          theme,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserShopProfile(
  uid: string,
  onData: (profile: ShopProfile, existsInCloud: boolean) => void
): () => void {
  const path = `users/${uid}/settings/shop`;
  const ref = doc(db, 'users', uid, 'settings', 'shop');

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_SHOP_PROFILE, false);
        return;
      }
      const data = snap.data();
      onData(
        {
          shopName: String(data.shopName ?? DEFAULT_SHOP_PROFILE.shopName),
          tagline: String(data.tagline ?? DEFAULT_SHOP_PROFILE.tagline),
          phone: String(data.phone ?? DEFAULT_SHOP_PROFILE.phone),
          address: String(data.address ?? DEFAULT_SHOP_PROFILE.address),
          stampText: String(data.stampText ?? DEFAULT_SHOP_PROFILE.stampText),
        },
        true
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function upsertUserNote(
  uid: string,
  note: VoiceNote,
  isExisting: boolean
): Promise<void> {
  const path = `users/${uid}/notes/${note.id}`;
  const ref = doc(db, 'users', uid, 'notes', note.id);
  const safeTitle =
    clampString(note.title, BLUEPRINT_LIMITS.NOTE_TITLE_MAX) || 'Untitled Memo';
  const safeContent = note.content.slice(0, BLUEPRINT_LIMITS.NOTE_CONTENT_MAX);

  try {
    if (isExisting) {
      await updateDoc(ref, {
        title: safeTitle,
        content: safeContent,
        speechLang: note.speechLang,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        title: safeTitle,
        content: safeContent,
        speechLang: note.speechLang,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteUserNote(uid: string, noteId: string): Promise<void> {
  const path = `users/${uid}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertUserInvoice(
  uid: string,
  invoice: Invoice,
  isExisting: boolean
): Promise<void> {
  const path = `users/${uid}/invoices/${invoice.id}`;
  const ref = doc(db, 'users', uid, 'invoices', invoice.id);
  const safeItems = sanitizeInvoiceItems(invoice.items);

  const payload = {
    invoiceNumber:
      clampString(invoice.invoiceNumber, BLUEPRINT_LIMITS.INVOICE_NUMBER_MAX) ||
      'INV-1001',
    date:
      clampString(invoice.date, BLUEPRINT_LIMITS.DATE_MAX) ||
      new Date().toISOString().slice(0, 10),
    customerName:
      clampString(invoice.customerName, BLUEPRINT_LIMITS.CUSTOMER_NAME_MAX) ||
      'Walk-in Customer',
    customerPhone: clampString(invoice.customerPhone, BLUEPRINT_LIMITS.PHONE_MAX),
    items: safeItems,
    discount: Math.max(0, Math.min(100000000, Number(invoice.discount) || 0)),
    deliveryCharge: Math.max(
      0,
      Math.min(100000000, Number(invoice.deliveryCharge) || 0)
    ),
    status: invoice.status === 'DUE' ? 'DUE' : 'PAID',
    paidAmount: Math.max(0, Math.min(100000000, Number(invoice.paidAmount) || 0)),
    theme: invoice.theme,
  };

  try {
    if (isExisting) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteUserInvoice(
  uid: string,
  invoiceId: string
): Promise<void> {
  const path = `users/${uid}/invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'invoices', invoiceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserShopProfile(
  uid: string,
  profile: ShopProfile
): Promise<void> {
  const path = `users/${uid}/settings/shop`;
  const ref = doc(db, 'users', uid, 'settings', 'shop');
  const safe = sanitizeShopProfile(profile);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        ...safe,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        ...safe,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
