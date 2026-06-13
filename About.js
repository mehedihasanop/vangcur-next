export default function About({ description }) {
  const desc = description || 'Vangcur (ভাঙচুর) — গ্যাজেট ও লাইফস্টাইল অ্যাক্সেসরিজের এক বিশ্বস্ত নাম। বাংলাদেশের প্রতিটি কোণে আমরা পৌঁছে দিচ্ছি সেরা মানের পণ্য, সাশ্রয়ী মূল্যে। আমাদের লক্ষ্য: শুধু পণ্য নয়, একটি নিরাপদ ও আনন্দময় শপিং অভিজ্ঞতা।';

  return (
    <section className="vc-about-sec" id="vcAboutSec">
      <div className="vc-about-inner">
        <div className="vc-about-badge">আমাদের সম্পর্কে</div>
        <h2 className="vc-about-title">Vangcur — <span>ভাঙচুর</span></h2>
        <p className="vc-about-desc" id="vcAboutDesc">{desc}</p>
      </div>
    </section>
  );
}
