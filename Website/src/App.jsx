import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Plus, Share, Link, Download } from 'lucide-react';
import './index.css';

export default function App() {
  // Screens: 'landing' | 'login_phone' | 'login_otp' | 'details' | 'id_qr'
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
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

  // Auto-advance splash screen after 2.2s
  useEffect(() => {
    if (currentScreen === 'landing') {
      const timer = setTimeout(() => setCurrentScreen('login_phone'), 2200);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Load any previously saved user data from private file / localStorage
  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const res = await fetch('/api/get-users');
        if (res.ok) {
          const users = await res.json();
          if (Array.isArray(users) && users.length > 0) {
            const latest = users[users.length - 1];
            if (latest.phoneNumber) {
              const digitsOnly = latest.phoneNumber.replace(/\D/g, '').slice(-10);
              setPhoneNumber(digitsOnly);
            }
            if (latest.ownerName) setOwnerName(latest.ownerName);
            if (latest.address) setAddress(latest.address);
            if (latest.petName) setPetName(latest.petName);
            if (latest.petSpecies) setPetSpecies(latest.petSpecies);
            if (latest.otherSpecies) setOtherSpecies(latest.otherSpecies);
            if (latest.bio) setBio(latest.bio);
            if (latest.petPhoto) setPetPhoto(latest.petPhoto);
          }
        }
      } catch (e) {
        // Fallback to localStorage if API is unreachable
        try {
          const cached = localStorage.getItem('purr_user_profile');
          if (cached) {
            const data = JSON.parse(cached);
            if (data.ownerName) setOwnerName(data.ownerName);
            if (data.petName) setPetName(data.petName);
            if (data.petSpecies) setPetSpecies(data.petSpecies);
            if (data.address) setAddress(data.address);
            if (data.bio) setBio(data.bio);
            if (data.petPhoto) setPetPhoto(data.petPhoto);
          }
        } catch {}
      }
    };
    fetchExistingProfile();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Indian Phone input handler (only digits, max 10 digits)
  const handlePhoneChange = (e) => {
    let raw = e.target.value;
    // Strip everything except digits
    let digits = raw.replace(/\D/g, '');

    // If user pasted 91 or +91 at beginning with more than 10 digits
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length > 10 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // Limit to exactly 10 digits
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    setPhoneNumber(digits);

    // Validate prefix: Indian mobile numbers must start with 6, 7, 8, or 9
    if (digits.length > 0 && !['6', '7', '8', '9'].includes(digits[0])) {
      setPhoneError('Indian mobile numbers start with 6, 7, 8, or 9');
    } else {
      setPhoneError('');
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();

    if (!phoneNumber) {
      setPhoneError('Please enter your 10-digit mobile number');
      showToast('Please enter your mobile number');
      return;
    }

    // Strict Indian mobile number validation
    const indianRegex = /^[6-9]\d{9}$/;
    if (!indianRegex.test(phoneNumber)) {
      if (phoneNumber.length < 10) {
        setPhoneError(`10 digits required (${phoneNumber.length}/10 entered)`);
        showToast('Please enter a complete 10-digit number');
      } else {
        setPhoneError('Indian numbers must start with 6, 7, 8, or 9');
        showToast('Invalid Indian mobile number');
      }
      return;
    }

    setIsLoading(true);
    setPhoneError('');
    const fullNumber = `+91 ${phoneNumber}`;

    setTimeout(() => {
      setIsLoading(false);
      showToast(`Phone number saved: ${fullNumber}`);
      // Skip OTP for now as requested; transition directly to Details registration
      setCurrentScreen('details');
    }, 350);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otpCode.trim()) { showToast('Please enter the verification code'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('details');
    }, 400);
  };

  // Convert uploaded image to resized base64 data URL so it can be saved in private file
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPetPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save details to private file on disk and localStorage
  const handleDetailsSave = async (e) => {
    e.preventDefault();
    if (!ownerName.trim()) { showToast("Please enter owner's name"); return; }
    if (!petName.trim()) { showToast("Please enter your pet's name"); return; }
    if (!petSpecies && !otherSpecies.trim()) { showToast('Please select or enter a pet species'); return; }

    setIsLoading(true);

    const fullPhoneNumber = phoneNumber ? `+91 ${phoneNumber}` : '+91 9876543210';
    const profile = {
      phoneNumber: fullPhoneNumber,
      ownerName: ownerName.trim(),
      address: address.trim(),
      petName: petName.trim(),
      petSpecies: petSpecies || otherSpecies.trim(),
      otherSpecies: otherSpecies.trim(),
      bio: bio.trim(),
      petPhoto: petPhoto || null,
      savedAt: new Date().toISOString(),
    };

    // 1. Save to browser localStorage as cache
    try {
      localStorage.setItem('purr_user_profile', JSON.stringify(profile));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // 2. Persist to local private JSON file via backend API
    try {
      const response = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (result.success) {
        showToast('Profile saved to private file! 🐾');
      } else {
        showToast('Profile saved! 🐾');
      }
    } catch (err) {
      console.error('File save error:', err);
      showToast('Profile saved locally! 🐾');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setCurrentScreen('id_qr');
      }, 400);
    }
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

        {/* SCREEN 2: PHONE LOGIN (Only Indian numbers with constant +91) */}
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
                  <div className={`phone-input-wrapper ${phoneError ? 'input-error' : ''}`}>
                    <div className="phone-prefix-badge">
                      <span className="country-flag" role="img" aria-label="India flag">🇮🇳</span>
                      <span className="prefix-code">+91</span>
                    </div>
                    <div className="phone-prefix-divider" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className="custom-phone-input"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      autoFocus
                    />
                  </div>
                  {phoneError ? (
                    <span className="field-error-text">{phoneError}</span>
                  ) : (
                    <span className="field-hint-text">Enter 10-digit Indian mobile number</span>
                  )}
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Continue'}
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

        {/* SCREEN 3: OTP VERIFICATION (Available if needed in future) */}
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
                Didn't receive a code?{' '}
                <span className="resend-link-action" onClick={() => showToast('New OTP sent!')}>
                  Resend Code
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: DETAILS / PROFILE SETUP */}
        {currentScreen === 'details' && (
          <div className="details-screen">
            <button className="back-btn" onClick={() => setCurrentScreen('login_phone')}>
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
                <button className="photo-plus-btn" onClick={() => fileInputRef.current?.click()} type="button">
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
                <button type="submit" className="btn-save-continue" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save and Continue'}
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

      {/* Screen quick switcher for preview and testing */}
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
