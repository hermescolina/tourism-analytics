import React from 'react';
import styles from './WhatsIncluded.module.css'; // Optional CSS module

export default function WhatsIncluded({ inclusions = [], exclusions = [] }) {
    if (!inclusions.length && !exclusions.length) return null;

    return (
        <section className={styles.container}>
            <div className={styles.columns}>
                <div>
                    <h3>INCLUSIONS:</h3>
                    <ul className={styles.list}>
                        {inclusions.map((item, idx) => (
                            <li key={idx} className={styles.inclusion}>
                                ✅ {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3>EXCLUSIONS:</h3>
                    <ul className={styles.list}>
                        {exclusions.map((item, idx) => (
                            <li key={idx} className={styles.exclusion}>
                                ❌ {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
