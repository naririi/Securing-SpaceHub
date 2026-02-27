import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.title}>Privacy Policy di SpaceHub</h1>
            <p style={styles.lastUpdated}>Ultimo aggiornamento: Febbraio 2026</p>

            <div style={styles.content}>
                <p>
                    La presente Privacy Policy descrive le modalità di gestione del sistema informativo <strong>SpaceHub</strong> in riferimento al trattamento dei dati personali degli utenti (studenti, docenti e personale amministrativo) che lo utilizzano.
                </p>

                <h2 style={styles.sectionTitle}>1. Titolare del Trattamento</h2>
                <p>
                    Il Titolare del trattamento dei dati è l'Ateneo, che gestisce il sistema SpaceHub per l'erogazione dei servizi didattici e la gestione degli spazi fisici.
                </p>

                <h2 style={styles.sectionTitle}>2. Dati Raccolti e Finalità (Audit e Sicurezza)</h2>
                <p>
                    Per garantire la sicurezza dell'infrastruttura e prevenire accessi non autorizzati (in ottemperanza alle direttive NIST SP 800-53), SpaceHub raccoglie automaticamente i seguenti dati di navigazione e utilizzo:
                </p>
                <ul>
                    <li><strong>Dati di Rete:</strong> Indirizzi IP, timestamp di accesso, e User-Agent.</li>
                    <li><strong>Dati di Autenticazione:</strong> Eventi di login (inclusi i tentativi falliti), logout e cambi di ruolo, gestiti tramite l'Identity Provider istituzionale.</li>
                    <li><strong>Dati di Accesso Fisico:</strong> Registrazione degli sblocchi dei varchi fisici tramite lettore RFID/Smart Card.</li>
                </ul>
                <p>
                    Questi dati non vengono utilizzati per profilazione a fini commerciali, ma <strong>esclusivamente</strong> per il monitoraggio della sicurezza (Audit Log), la prevenzione di attacchi informatici (es. Brute Force) e la verifica del corretto utilizzo delle strutture.
                </p>

                <h2 style={styles.sectionTitle}>3. Base Giuridica</h2>
                <p>
                    Il trattamento è lecito in quanto strettamente necessario per l'esecuzione di un compito di interesse pubblico connesso all'esercizio di pubblici poteri di cui è investito l'Ateneo (art. 6, par. 1, lett. e del GDPR), nonché per il legittimo interesse del Titolare a proteggere le proprie reti informatiche e gli spazi fisici.
                </p>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', color: '#333' },
    title: { fontSize: '28px', color: '#0056b3', marginBottom: '5px' },
    lastUpdated: { fontSize: '13px', color: '#777', marginBottom: '30px', fontStyle: 'italic' },
    sectionTitle: { fontSize: '20px', color: '#2c3e50', marginTop: '25px', borderBottom: '1px solid #eee', paddingBottom: '5px' },
    content: { lineHeight: '1.6', fontSize: '15px' }
};