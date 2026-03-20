const db = firebase.firestore();

const Store = {

  async initUser(userId) {
    const ref = db.collection("users").doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        plan: "free",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return "free";
    }
    return snap.data().plan || "free";
  },

  async loadPaints(userId) {
    const snap = await db.collection("users").doc(userId).collection("paints").get();
    const owned = new Set();
    snap.forEach(doc => {
      if (doc.data().owned) owned.add(Number(doc.id));
    });
    return owned;
  },

  async savePaint(userId, paintId) {
    await db.collection("users").doc(userId).collection("paints").doc(String(paintId)).set({
      owned: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async deletePaint(userId, paintId) {
    await db.collection("users").doc(userId).collection("paints").doc(String(paintId)).delete();
  }

};
