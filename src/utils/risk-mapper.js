/**
 * Categorize ISO 27001 clause title into risk level
 * @param {string} title - Clause title
 * @returns {"Low" | "Medium" | "High"}
 */
export function categorizeRisk(title) {
    if (!title) return "Low";

    const t = title.toLowerCase();

    // 🔥 HIGH RISK KEYWORDS
    const highKeywords = [
        "Access control",
        "Identity management",
        "Authentication information",
        "Access rights",
        "Privileged access rights",
        "Information access restriction",
        "Access to source code",
        "Secure authentication",
        "Secure development life cycle",
        "Application security requirements",
        "Secure system architecture and engineering principles",
        "Secure coding",
        "Security testing in development and acceptance",
        "Outsourced development",
        "Separation of development test and production environments",
        "Management of technical vulnerabilities",
        "Protection against malware",
        "Network security",
        "Security of network services",
        "Use of cryptography",
        "Key management",
        "Information backup",
        "Redundancy of information processing facilities",
        "Monitoring activities",
        "Logging",
        "Information security during disruption",
        "ICT readiness for business continuity",
        "Information security incident management planning and preparation",
        "Assessment and decision on information security events",
        "Response to information security incidents",
        "Learning from information security incidents",
        "Collection of evidence",
        "Data leakage prevention",
        "Information deletion",
        "Data masking",
        "Use of privileged utility programs",
        "Installation of software on operational systems"
    ];

    // ⚠️ MEDIUM RISK KEYWORDS
    const mediumKeywords = [
        "Information security roles and responsibilities",
        "Segregation of duties",
        "Management responsibilities",
        "Contact with authorities",
        "Contact with special interest groups",
        "Threat intelligence",
        "Information security in project management",
        "Inventory of information and other associated assets",
        "Acceptable use of information and other associated assets",
        "Return of assets",
        "Classification of information",
        "Labelling of information",
        "Information transfer",
        "Information security in supplier relationships",
        "Addressing information security within supplier agreements",
        "Managing information security in the ICT supply chain",
        "Monitoring review and change management of supplier services",
        "Information security for use of cloud services",
        "Legal statutory regulatory and contractual requirements",
        "Intellectual property rights",
        "Protection of records",
        "Privacy and protection of personally identifiable information (PII)",
        "Independent review of information security",
        "Compliance with policies rules and standards for information security",
        "Documented operating procedures",
        "Screening",
        "Terms and conditions of employment",
        "Information security awareness education and training",
        "Disciplinary process",
        "Responsibilities after termination or change of employment",
        "Confidentiality or non-disclosure agreements",
        "Remote working",
        "Information security event reporting",
        "Physical security perimeter",
        "Physical entry controls",
        "Securing offices rooms and facilities",
        "Physical security monitoring",
        "Protection against physical and environmental threats",
        "Working in secure areas",
        "Clear desk and clear screen",
        "Security of assets off-premises",
        "Equipment siting and protection",
        "Storage media",
        "Supporting utilities",
        "Cabling security",
        "Equipment maintenance",
        "Secure disposal or re-use of equipment",
        "User endpoint devices",
        "Capacity management",
        "Configuration management",
        "Clock synchronization",
        "Test data",
        "Change management",
        "Protection of information systems during audit testing"
    ];

    // 🟢 LOW RISK KEYWORDS
    const lowKeywords = [
        "Policies for information security",
        "Documented operating procedures",
        "Management responsibilities (governance aspects)",
        "Compliance with policies rules and standards for information security (documentation layer)",
        "Information security in project management (documentation aspects)"
    ];

    // Helper to check keywords
    const matches = (keywords) =>
        keywords.some(k => t.includes(k.toLowerCase()));

    if (matches(highKeywords)) return "High";
    if (matches(mediumKeywords)) return "Medium";
    if (matches(lowKeywords)) return "Low";

    // Default category
    return "Medium";
}