import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    reported: 0,
    returned: 0,
    users: 0,
    claims: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Use a ref to track animation state without triggering re-renders
  const animationRef = useRef(null);

  useEffect(() => {
    // Create observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Explicitly check for impact section to trigger numbers
            if (entry.target.classList.contains('impact-section')) {
              startCounting();
            }
          }
        });
      },
      { threshold: 0.15 } // Trigger slightly earlier
    );

    const sections = document.querySelectorAll('.timeline-item');
    const impactSection = document.querySelector('.impact-section');

    sections.forEach((section) => observer.observe(section));
    if (impactSection) observer.observe(impactSection);

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      if (impactSection) observer.unobserve(impactSection);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []); // Empty dependency array - logic handles single run via local variable/state check

  const startCounting = () => {
    // Prevent multiple runs if state update is lagging
    setHasAnimated((prev) => {
      if (prev) return true;

      const targets = {
        reported: 500,
        returned: 320,
        users: 1200,
        claims: 180
      };

      const duration = 2000; // 2 seconds
      let startTime = null;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);

        // Easing function: EaseOutQuart
        const ease = 1 - Math.pow(1 - percentage, 4);

        setCounts({
          reported: Math.floor(targets.reported * ease),
          returned: Math.floor(targets.returned * ease),
          users: Math.floor(targets.users * ease),
          claims: Math.floor(targets.claims * ease)
        });

        if (percentage < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Snap to final values
          setCounts(targets);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
      return true;
    });
  };

  return (
    <div className="home-container">
      <div className="hero-section text-center">
        <h1 className="hero-title">
          Found-It — MBU Lost & Found
        </h1>
        <div className="hero-subtitle-wrapper">
          <div className="hero-subtitle-glass">
            <p className="hero-subtitle">
              Reuniting students with their belongings at Mohan Babu University
            </p>
          </div>
        </div>


      </div>

      {/* How It Works - Timeline Section */}
      <div className="timeline-section">
        <div className="timeline-header">
          <h2 className="timeline-title">How It Works</h2>
          <p className="timeline-subtitle">Three simple steps to get your items back</p>
        </div>

        <div className="timeline-container">
          {/* Central Line */}
          <div className="timeline-line"></div>

          {/* Step 01: Report */}
          <div className="timeline-item slide-left">
            <div className="timeline-content left">
              <h3>Report Lost or Found Items</h3>
              <p>Quickly report any lost or found item with detailed descriptions and photos to help others identify it.</p>
            </div>
            <div className="timeline-marker">
              <div className="hex-icon">📝</div>
            </div>
            <div className="timeline-empty"></div>
          </div>

          {/* Step 02: Browse */}
          <div className="timeline-item slide-right">
            <div className="timeline-empty"></div>
            <div className="timeline-marker">
              <div className="hex-icon">🔍</div>
            </div>
            <div className="timeline-content right">
              <h3>Browse Found Items Gallery</h3>
              <p>Search through our organized gallery of found items with real-time updates and smart filters.</p>
            </div>
          </div>

          {/* Step 03: Claim */}
          <div className="timeline-item slide-left">
            <div className="timeline-content left">
              <h3>Claim Your Item Securely</h3>
              <p>Verify ownership through our secure process and collect your item from the university office.</p>
            </div>
            <div className="timeline-marker">
              <div className="hex-icon">✅</div>
            </div>
            <div className="timeline-empty"></div>
          </div>
        </div>
      </div>

      {/* Community Impact Section */}
      <div className="impact-section">
        <div className="impact-container">
          <div className="impact-header">
            <h2 className="impact-title">Our Community Impact</h2>
            <p className="impact-subtitle">Empowering the campus with trust and transparency</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{counts.reported}+</div>
              <div className="stat-label">Items Reported</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counts.returned}+</div>
              <div className="stat-label">Items Returned</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counts.users.toLocaleString()}+</div>
              <div className="stat-label">Registered Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counts.claims}+</div>
              <div className="stat-label">Active Claims</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
