import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

// Generic CRUD operations for Firestore

export const createDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const getDocuments = async (
  collectionName: string, 
  constraints: QueryConstraint[] = []
) => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

// Helper functions for common query patterns
export const getDocumentsByField = async (
  collectionName: string, 
  field: string, 
  value: any
) => {
  return getDocuments(collectionName, [where(field, '==', value)]);
};

export const getDocumentsOrderedBy = async (
  collectionName: string, 
  field: string, 
  direction: 'asc' | 'desc' = 'asc',
  limitCount?: number
) => {
  const constraints = [orderBy(field, direction)];
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  return getDocuments(collectionName, constraints);
};

// Export query functions for use in API routes
export { where, orderBy, limit };