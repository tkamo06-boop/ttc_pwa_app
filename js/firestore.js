const Store = {

  // firebase.firestore() を呼び出すたびに取得（初期化タイミング問題を回避）
  col(path) {
    return firebase.firestore().collection(path);
  },

  async initUser(userId) {
    const ref = this.col("users").doc(userId);
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
    const snap = await this.col("users").doc(userId).collection("paints").get();
    const owned = new Set();
    snap.forEach(doc => {
      if (doc.data().owned) owned.add(Number(doc.id));
    });
    return owned;
  },

  async savePaint(userId, paintId) {
    await this.col("users").doc(userId).collection("paints").doc(String(paintId)).set({
      owned: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async deletePaint(userId, paintId) {
    await this.col("users").doc(userId).collection("paints").doc(String(paintId)).delete();
  },

  async migrateFromLocal(userId, ownedSet) {
    const batch = firebase.firestore().batch();
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    ownedSet.forEach(paintId => {
      const ref = this.col("users").doc(userId).collection("paints").doc(String(paintId));
      batch.set(ref, { owned: true, updatedAt: ts });
    });
    await batch.commit();
  }

};
