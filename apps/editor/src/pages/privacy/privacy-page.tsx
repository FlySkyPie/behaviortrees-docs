const PrivacyPage: React.FC = () => (
  <article className="mx-auto max-w-3xl">
    <div className="kicker mb-3 text-accent-soft">隱私</div>
    <h1 className="text-4xl font-medium tracking-[-0.02em]">隱私權聲明</h1>
    <p className="mt-4 text-sm text-faint">最後更新：2026 年 7 月 28 日</p>

    <div className="mt-10 space-y-8 text-muted">
      <section>
        <h2 className="mb-2 text-xl font-medium text-fg">專案</h2>
        <p>
          匿名專案儲存在您的瀏覽器中。若您登入，專案資料會儲存在
          我們的雲端資料庫中，以便在您的裝置間同步。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-medium text-fg">產品分析</h2>
        <p>
          我們使用 Plausible 分析網站流量，並使用 PostHog 追蹤產品事件、
          留存率、意見回饋調查及遮罩式工作階段重播。PostHog 會在本地儲存一個
          第一方識別碼，以便我們了解重複使用情況。我們
          不會故意在產品事件中傳送專案名稱、節點名稱、行為樹內容、電子郵件
          地址或自由形式的專案資料。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-medium text-fg">帳戶</h2>
        <p>
          Clerk 提供身分驗證服務。當您登入時，我們使用您的 Clerk 使用者 ID 將
          雲端專案與您的帳戶關聯。您的帳戶名稱和電子郵件可能用於
          帳戶管理與支援。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-medium text-fg">早期存取請求</h2>
        <p>
          如果您請求 Pro、Team 或整合存取權限，我們會儲存您的電子郵件、所選
          執行環境、團隊規模、生產障礙以及您自願提供的任何詳細
          資訊。我們使用這些資訊來評估需求並就您的請求與您聯繫。
          我們不會出售這些資訊。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-medium text-fg">您的選擇</h2>
        <p>
          您可以在沒有帳戶的情況下使用編輯器。清除此網站的瀏覽器
          儲存空間會移除本地專案及該瀏覽器中的匿名分析識別碼。若要請求
          存取、更正或刪除與您的帳戶或早期存取請求相關的資訊，
          請使用應用程式中的「意見回饋」按鈕。
        </p>
      </section>
    </div>
  </article>
);

export default PrivacyPage;
