export default function MarqueeBar({ text }) {
  const defaultText = "সাম্প্রতিক পোস্ট : একোনাইটাম নেপেলাস [Aconitum Napellus] , এ্যাকটিয়া রেসিমোসা [Actea Racemosa]      |      যোগাযোগ করুন +8801720970031";
  return (
    <div className="marquee-bar">
      <div className="marquee-content">
        {text || defaultText}
      </div>
    </div>
  );
}
