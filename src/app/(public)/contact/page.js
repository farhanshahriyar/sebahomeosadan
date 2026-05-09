export const metadata = {
  title: "যোগাযোগ | Good Health Homeo Care",
  description: "Good Health Homeo Care এর সাথে যোগাযোগ করুন। ঠিকানা: খঞ্জনপুর, জয়পুরহাট, বাংলাদেশ।",
};

export default function ContactPage() {
  return (
    <>
      <section className="contact-hero" id="contact-hero">
        <div className="container">
          <h4>যোগাযোগ করুন</h4>
          <h2>চল একসাথে থাকি!</h2>
        </div>
      </section>

      <div className="container">
        <div className="contact-grid">
          <div className="contact-form" id="contact-form">
            <h2>আমাদের একটি বার্তা পাঠান</h2>
            <form>
              <div className="form-row">
                <div className="form-group">
                  <input type="text" placeholder="নাম" required id="contact-name" />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="ইমেইল" required id="contact-email" />
                </div>
              </div>
              <div className="form-group">
                <input type="text" placeholder="বিষয়" id="contact-subject" />
              </div>
              <div className="form-group">
                <textarea placeholder="বার্তা" required id="contact-message" />
              </div>
              <button type="submit" className="btn btn-accent" id="contact-submit">
                বার্তা পাঠান
              </button>
            </form>
          </div>

          <div className="contact-info" id="contact-info">
            <h2>যোগাযোগের তথ্য</h2>
            <ul>
              <li>
                <h5>01720970031</h5>
                <span>ফোন নম্বর</span>
              </li>
              <li>
                <h5>amirul1068@gmail.com</h5>
                <span>ইমেইল ঠিকানা</span>
              </li>
              <li>
                <h5>খঞ্জনপুর, জয়পুরহাট<br />বাংলাদেশ</h5>
                <span>রাস্তার ঠিকানা</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="map-container" id="google-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14452.090196255396!2d88.99680482504839!3d25.101098024376792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fc91e5a27bc89d%3A0xaa1008c50e27f342!2sKhanjanpur!5e0!3m2!1sen!2sbd!4v1622114571933!5m2!1sen!2sbd"
            allowFullScreen
            loading="lazy"
            title="Good Health Homeo Care মানচিত্র"
          />
        </div>
      </div>
    </>
  );
}
