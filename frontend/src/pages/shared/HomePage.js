// src/pages/HomePage.js

import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { Helmet } from 'react-helmet'; // Import Helmet
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import Bootstrap Icons
import './HomePage.css'; // Custom CSS
import { AuthContext } from '../../AuthContext'; // Import AuthContext
import HomePageHeader from '../../components/HomePageHeader'; // Import the new header component
import { useTranslation } from 'react-i18next'; // Import useTranslation

const HomePage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { isAuthenticated } = useContext(AuthContext); // Consume AuthContext

    return (
        <div className="home-page" dir={i18n.dir()}>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{t('seo.title')}</title>
                <meta name="description" content={t('seo.description')} />
                <meta name="keywords" content={t('seo.keywords')} />
                <meta name="author" content={t('seo.author')} />
                
                {/* Open Graph / Facebook */}
                <meta property="og:title" content={t('seo.og.title')} />
                <meta property="og:description" content={t('seo.og.description')} />
                <meta property="og:url" content={t('seo.og.url')} />
                <meta property="og:type" content={t('seo.og.type')} />
                <meta property="og:image" content={t('seo.og.image')} /> {/* Replace with your image URL */}

                {/* Twitter */}
                <meta name="twitter:card" content={t('seo.twitter.card')} />
                <meta name="twitter:title" content={t('seo.twitter.title')} />
                <meta name="twitter:description" content={t('seo.twitter.description')} />
                <meta name="twitter:image" content={t('seo.twitter.image')} /> {/* Replace with your image URL */}

                {/* Structured Data */}
                <script type="application/ld+json">
                    {`
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Qr Qaema",
                        "url": "https://qrqaema.com/",
                        "logo": "https://qrqaema.com/images/logo.png",
                        "sameAs": [
                            "https://www.facebook.com/qrqaema",
                            "https://twitter.com/qrqaema",
                            "https://www.linkedin.com/company/qrqaema"
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "telephone": "+1-800-555-1234",
                            "contactType": "Customer Service",
                            "availableLanguage": ["Arabic", "English"]
                        }
                    }
                    `}
                </script>

                {/* Canonical URL */}
                <link rel="canonical" href="https://qrqaema.com/" />
            </Helmet>

            {/* Header */}
            <HomePageHeader />

            {/* Welcome (Hero) Section */}
            <section className="welcome-section text-center text-white gradient-bg" id="welcome">
                <div className="welcome-overlay">
                    <div className="container">
                        <h1 className="display-4 font-weight-bold">{t('hero.title')}</h1>
                        <p className="lead mt-3">{t('hero.subtitle')}</p>
                        <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                            <ScrollLink
                                to="features"
                                smooth={true}
                                offset={-70}
                                duration={500}
                                className="btn btn-primary btn-lg"
                                role="button"
                            >
                                {t('hero.discoverFeatures')}
                            </ScrollLink>
                            <RouterLink to="/register" className="btn btn-outline-light btn-lg" role="button">
                                {t('hero.startNow')}
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section py-5 text-white" id="features">
                <h2 className="mb-5 text-center">{t('features.title')}</h2>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-4 text-center">
                            <i className="bi bi-card-text feature-icon" aria-hidden="true"></i>
                            <h3 className="mt-3">{t('features.feature1.title')}</h3>
                            <p>
                                {t('features.feature1.description')}
                            </p>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-upc-scan feature-icon" aria-hidden="true"></i>
                            <h3 className="mt-3">{t('features.feature2.title')}</h3>
                            <p>
                                {t('features.feature2.description')}
                            </p>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-cart-check feature-icon" aria-hidden="true"></i>
                            <h3 className="mt-3">{t('features.feature3.title')}</h3>
                            <p>
                                {t('features.feature3.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section py-5 white-bg" id="how-it-works">
                <h2 className="mb-5 text-center">{t('howItWorks.title')}</h2>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-4 text-center">
                            <i className="bi bi-pencil-square feature-icon" aria-hidden="true"></i>
                            <h4 className="mt-3">{t('howItWorks.step1.title')}</h4>
                            <p>{t('howItWorks.step1.description')}</p>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-upc-scan feature-icon" aria-hidden="true"></i>
                            <h4 className="mt-3">{t('howItWorks.step2.title')}</h4>
                            <p>
                                {t('howItWorks.step2.description')}
                            </p>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-cart-check feature-icon" aria-hidden="true"></i>
                            <h4 className="mt-3">{t('howItWorks.step3.title')}</h4>
                            <p>
                                {t('howItWorks.step3.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section py-5 text-white" id="pricing">
                <div className="container text-center">
                    <h2 className="mb-5">{t('pricing.title')}</h2>
                    <p className="lead">
                        {t('pricing.subtitle')}
                    </p>
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <div className="card bg-white text-dark text-center">
                                <div className="card-header">
                                    <h3>{t('pricing.plan')}</h3>
                                </div>
                                <div className="card-body">
                                    <h4 className="card-title">{t('pricing.price')}</h4>
                                    <p className="card-text">{t('pricing.description')}</p>
                                    <ul className="list-group list-group-flush text-right">
                                        <li className="list-group-item bg-white text-dark">
                                            <i className="bi bi-check-circle" aria-hidden="true"></i> {t('pricing.features.feature1')}
                                        </li>
                                        <li className="list-group-item bg-white text-dark">
                                            <i className="bi bi-check-circle" aria-hidden="true"></i> {t('pricing.features.feature2')}
                                        </li>
                                        <li className="list-group-item bg-white text-dark">
                                            <i className="bi bi-check-circle" aria-hidden="true"></i> {t('pricing.features.feature3')}
                                        </li>
                                        <li className="list-group-item bg-white text-dark">
                                            <i className="bi bi-check-circle" aria-hidden="true"></i> {t('pricing.features.feature4')}
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-footer">
                                    <RouterLink to="/register" className="btn btn-primary">
                                        {t('pricing.button')}
                                    </RouterLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Testimonials Section */}
            <section className="how-it-works-section py-5 white-bg" id="testimonials">
                <h2 className="mb-5 text-center">{t('testimonials.title')}</h2>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-4 text-center">
                            <i className="bi bi-chat-left-quote feature-icon" aria-hidden="true"></i>
                            <p>
                                "{t('testimonials.testimonial1')}"
                            </p>
                            <h5>- {t('testimonials.user1')}</h5>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-chat-left-quote feature-icon" aria-hidden="true"></i>
                            <p>
                                "{t('testimonials.testimonial2')}"
                            </p>
                            <h5>- {t('testimonials.user2')}</h5>
                        </div>
                        <div className="col-md-4 text-center">
                            <i className="bi bi-chat-left-quote feature-icon" aria-hidden="true"></i>
                            <p>
                                "{t('testimonials.testimonial3')}"
                            </p>
                            <h5>- {t('testimonials.user3')}</h5>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="cta-section py-5 text-white text-center" id="cta">
                <div className="container">
                    <h2>{t('cta.title')}</h2>
                    <p>{t('cta.subtitle')}</p>
                    <RouterLink to="/register" className="btn btn-primary btn-lg" role="button">
                        {t('cta.button')}
                    </RouterLink>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer-section bg-dark text-white text-center py-4">
                <p>© 2024 Qr Qaema. {t('footer.rights')}</p>
                <p>
                    <RouterLink to="/privacy" className="text-white">
                        {t('footer.privacyPolicy')}
                    </RouterLink>{' '}
                    |{' '}
                    <RouterLink to="/terms" className="text-white ms-2">
                        {t('footer.termsAndConditions')}
                    </RouterLink>
                </p>
            </footer>
        </div>
    );

};

export default HomePage;
