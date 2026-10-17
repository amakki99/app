// sync.js - محرك المزامنة السحابية الموحد
(function () {
  const SUPABASE_URL = "https://gbrelsfdoiweaycpbgjd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_3INtgPuK38hO4UcqPn6wXg_uZziH7ex";
  let dbClient = null;

  function getClient(callback) {
    if (dbClient) {
      callback(dbClient);
      return;
    }
    if (window.supabase) {
      dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      callback(dbClient);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = function () {
      dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      callback(dbClient);
    };
    document.head.appendChild(script);
  }

  window.CloudSync = {
    // 1. حفظ البيانات السحابية لأي تطبيق
    save: function (appId, data) {
      return new Promise((resolve, reject) => {
        getClient(async (db) => {
          try {
            const payload = typeof data === "string" ? data : JSON.stringify(data);
            const { error } = await db
              .from("my_app_data")
              .upsert({ id: appId, content: payload, updated_at: new Date() });

            if (error) {
              console.error("[CloudSync] خطأ في الحفظ:", error.message);
              reject(error);
            } else {
              console.log(`[CloudSync] تم حفظ بيانات التطبيق (${appId}) بنجاح.`);
              resolve(true);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    },

    // 2. جلب البيانات السحابية لأي تطبيق
    load: function (appId, callback) {
      return new Promise((resolve, reject) => {
        getClient(async (db) => {
          try {
            const { data, error } = await db
              .from("my_app_data")
              .select("content")
              .eq("id", appId)
              .single();

            if (error && error.code !== "PGRST116") {
              console.error("[CloudSync] خطأ في الجلب:", error.message);
              if (callback) callback(null, error);
              reject(error);
              return;
            }

            let parsedData = null;
            if (data && data.content) {
              try {
                parsedData = JSON.parse(data.content);
              } catch (e) {
                parsedData = data.content;
              }
            }

            if (callback) callback(parsedData, null);
            resolve(parsedData);
          } catch (err) {
            if (callback) callback(null, err);
            reject(err);
          }
        });
      });
    }
  };
})();
