import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Plus, Share, Link, Download } from 'lucide-react';
import './index.css';

export default function App() {
  // Screens: 'landing' | 'login_phone' | 'login_otp' | 'details' | 'id_qr'
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Details form state
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [petName, setPetName] = useState('Ponya');
  const [petSpecies, setPetSpecies] = useState('Cat');
  const [otherSpecies, setOtherSpecies] = useState('');
  const [bio, setBio] = useState('');
  const [petPhoto, setPetPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-advance splash screen after 2.5s
  useEffect(() => {
    if (currentScreen === 'landing') {
      const timer = setTimeout(() => setCurrentScreen('login_phone'), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) { showToast('Please enter your phone number'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('login_otp');
      showToast('OTP sent to ' + phoneNumber);
    }, 400);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otpCode.trim()) { showToast('Please enter the 6-digit code'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('details');
    }, 500);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPetPhoto(URL.createObjectURL(file));
  };

  const handleDetailsSave = (e) => {
    e.preventDefault();
    if (!ownerName.trim()) { showToast('Please enter your name'); return; }
    if (!petName.trim()) { showToast("Please enter your pet's name"); return; }
    if (!petSpecies) { showToast('Please select a pet species'); return; }
    showToast('Profile saved! 🐾');
    setTimeout(() => {
      setCurrentScreen('id_qr');
    }, 400);
  };

  // QR Screen Action Handlers
  const handleShareProfile = async () => {
    const displayName = petName.trim() || 'Ponya';
    const shareData = {
      title: `${displayName}'s Profile on Purr`,
      text: `Meet ${displayName} on Purr — Your Pet's town!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Profile link copied!');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Profile link copied to clipboard!');
      } catch {
        showToast('Share link ready!');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    } catch {
      showToast('Link copied!');
    }
  };

  const handleDownload = () => {
    const displayName = petName.trim() || 'Ponya';
    const link = document.createElement('a');
    link.href = '/assets/qr_code.png';
    link.download = `${displayName}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code downloaded!');
  };

  const SPECIES = ['Cat', 'Dog', 'Rabbit', 'Cow'];

  return (
    <div className="viewport-container">
      <div className="app-viewport">
        {toastMessage && <div className="toast-msg">{toastMessage}</div>}

        {/* SCREEN 1: SPLASH / LOADING */}
        {currentScreen === 'landing' && (
          <div className="landing-screen" onClick={() => setCurrentScreen('login_phone')}>
            <h1 className="brand-title-landing">PURR</h1>
            <p className="brand-subtitle-landing">Your Pet's town</p>
            <img
              src="/assets/cat_illustration.png"
              alt="Purr Cat"
              className="splash-cat-illustration"
            />
          </div>
        )}

        {/* SCREEN 2: PHONE LOGIN */}
        {currentScreen === 'login_phone' && (
          <div className="auth-screen">
            <button className="back-btn" onClick={() => setCurrentScreen('landing')}>
              <ArrowLeft size={18} />
            </button>
            <div className="auth-card">
              <h1 className="brand-title-auth">PURR</h1>
              <p className="brand-subtitle-auth">Your Pet's town</p>
              <form onSubmit={handlePhoneSubmit} className="auth-form">
                <div className="input-field-container">
                  <label className="input-label">Phone no</label>
                  <input
                    type="tel"
                    className="custom-input"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>
              <div className="divider-container">
                <div className="divider-line" />
                <span className="divider-text">or continue with:</span>
                <div className="divider-line" />
              </div>
              <div className="auth-footer-text">
                Already have an Account? <strong>Log in</strong>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: OTP VERIFICATION */}
        {currentScreen === 'login_otp' && (
          <div className="auth-screen">
            <button className="back-btn" onClick={() => setCurrentScreen('login_phone')}>
              <ArrowLeft size={18} />
            </button>
            <div className="auth-card">
              <h1 className="brand-title-auth">PURR</h1>
              <p className="brand-subtitle-auth">Your Pet's town</p>
              <form onSubmit={handleOtpSubmit} className="auth-form">
                <div className="input-field-container">
                  <label className="input-label">Enter OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="custom-input"
                    placeholder="6 Digit Verification Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
              <div className="resend-link">
                Did't receive a code?{' '}
                <span className="resend-link-action" onClick={() => showToast('New OTP sent!')}>
                  Resent Code
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: DETAILS / PROFILE SETUP */}
        {currentScreen === 'details' && (
          <div className="details-screen">
            <button className="back-btn" onClick={() => setCurrentScreen('login_otp')}>
              <ArrowLeft size={18} />
            </button>
            <div className="details-scroll">
              {/* Photo Upload */}
              <div className="photo-upload-area">
                <div className="photo-box" onClick={() => fileInputRef.current?.click()}>
                  {petPhoto
                    ? <img src={petPhoto} alt="Pet" className="photo-preview" />
                    : <Camera size={24} color="#848484" />
                  }
                </div>
                <button className="photo-plus-btn" onClick={() => fileInputRef.current?.click()}>
                  <Plus size={12} color="#EDEDED" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Form Fields */}
              <form onSubmit={handleDetailsSave} className="details-form">

                {/* Owner's Name */}
                <div className="details-field-group">
                  <label className="details-label">Owner's name</label>
                  <input
                    type="text"
                    className="details-input"
                    placeholder="Full Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                {/* Local Address */}
                <div className="details-field-group">
                  <label className="details-label">Local Address</label>
                  <input
                    type="text"
                    className="details-input"
                    placeholder="Street name, Block, Landmark, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Pet's Name */}
                <div className="details-field-group">
                  <label className="details-label">Pet's name</label>
                  <input
                    type="text"
                    className="details-input"
                    placeholder='e.g. "Ponya"'
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                  />
                </div>

                {/* Pet Species */}
                <div className="details-field-group">
                  <label className="details-label">Pet Species</label>
                  <div className="species-chips">
                    {SPECIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`species-chip${petSpecies === s ? ' selected' : ''}`}
                        onClick={() => setPetSpecies(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="details-input"
                    placeholder="(Others)"
                    value={petSpecies === '' || SPECIES.includes(petSpecies) ? otherSpecies : petSpecies}
                    onChange={(e) => {
                      setOtherSpecies(e.target.value);
                      setPetSpecies(e.target.value);
                    }}
                    onFocus={() => {
                      if (SPECIES.includes(petSpecies)) setPetSpecies('');
                    }}
                    style={{ marginTop: 6 }}
                  />
                </div>

                {/* Bio */}
                <div className="details-field-group">
                  <label className="details-label">Bio (optional)</label>
                  <input
                    type="text"
                    className="details-input"
                    placeholder="Describe the personality of your pet."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Save Button */}
                <button type="submit" className="btn-save-continue">
                  Save and Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SCREEN 5: ID, QR */}
        {currentScreen === 'id_qr' && (
          <div className="id-qr-screen">
            <button className="back-btn qr-back-btn" onClick={() => setCurrentScreen('details')}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="brand-title-qr">PURR</h1>

            {/* QR Card */}
            <div className="qr-card">
              <div className="qr-image-wrapper">
                <img
                  src="/assets/qr_code.png"
                  alt="Pet Profile QR Code"
                  className="qr-code-img"
                />
              </div>
              <p className="qr-pet-name">{petName.trim() || 'Ponya'}</p>
            </div>

            {/* Action Buttons Row */}
            <div className="qr-actions-row">
              <button className="qr-action-btn" onClick={handleShareProfile}>
                <Share size={20} color="#000000" strokeWidth={1.8} />
                <span className="qr-action-label">Share Profile</span>
              </button>

              <button className="qr-action-btn" onClick={handleCopyLink}>
                <Link size={20} color="#000000" strokeWidth={1.8} />
                <span className="qr-action-label">Copy Link</span>
              </button>

              <button className="qr-action-btn" onClick={handleDownload}>
                <Download size={20} color="#000000" strokeWidth={1.8} />
                <span className="qr-action-label">Download</span>
              </button>
            </div>

            {/* Suggestion Text */}
            <p className="qr-suggestion-text">
              Suggestion: Apply this QR on your pet’s belt
            </p>
          </div>
        )}
      </div>

      {/* Screen quick switcher for easy navigation */}
      <div className="dev-screen-switcher">
        <button
          className={`dev-screen-btn ${currentScreen === 'landing' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('landing')}
          title="Screen 1: Landing"
        >
          1: Splash
        </button>
        <button
          className={`dev-screen-btn ${currentScreen === 'login_phone' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('login_phone')}
          title="Screen 2: Phone Login"
        >
          2: Phone
        </button>
        <button
          className={`dev-screen-btn ${currentScreen === 'login_otp' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('login_otp')}
          title="Screen 3: OTP"
        >
          3: OTP
        </button>
        <button
          className={`dev-screen-btn ${currentScreen === 'details' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('details')}
          title="Screen 4: Details"
        >
          4: Details
        </button>
        <button
          className={`dev-screen-btn ${currentScreen === 'id_qr' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('id_qr')}
          title="Screen 5: ID & QR"
        >
          5: QR ID
        </button>
      </div>
    </div>
  );
}
