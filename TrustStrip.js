export default function TrustStrip({ waNumber = '01816-365504' }) {
  return (
    <div className="trust-wrap">
      <div className="trust-strip">
        <div className="t-item">
          <div className="t-icon">🚚</div>
          <div>
            <div className="t-label">দ্রুত ডেলিভারি</div>
            <div className="t-sub">ঢাকা ১-৩ দিন</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">🛡️</div>
          <div>
            <div className="t-label">ওয়ারেন্টি</div>
            <div className="t-sub">সকল প্রোডাক্টে</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">✅</div>
          <div>
            <div className="t-label">অথেনটিক</div>
            <div className="t-sub">১০০% নিশ্চিত</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">💬</div>
          <div>
            <div className="t-label">সাপোর্ট</div>
            <div className="t-sub" id="trustWaNum">WhatsApp: {waNumber}</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">🔄</div>
          <div>
            <div className="t-label">রিটার্ন পলিসি</div>
            <div className="t-sub">৭ দিনের মধ্যে</div>
          </div>
        </div>
      </div>
    </div>
  );
}
