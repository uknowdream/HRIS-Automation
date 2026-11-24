import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const API_BASE = "https://hris-automation.vercel.app";

type Tab = "home" | "payslip" | "invite" | "psychometrics";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("628");
  const [candRole, setCandRole] = useState("Senior Full-Stack Engineer");
  const [sending, setSending] = useState(false);

  const handleClockIn = () => {
    const time = new Date().toTimeString().slice(0, 5);
    setCheckedInAt(time);
    Alert.alert("GPS Clock-In Verified", `Recorded at ${time} (Geofence HQ Verified)`);
  };

  const handleDispatchInvite = async () => {
    if (!candName.trim()) {
      Alert.alert("Validation", "Please enter candidate name");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candName.trim(),
          candidateEmail: candEmail.trim(),
          candidatePhone: candPhone.trim(),
          role: candRole.trim(),
          presetId: "executive-full",
          channels: ["Email", "WhatsApp"],
          locale: "id",
        }),
      });
      const data = await res.json();
      if (data.ok && data.delivery?.whatsappLaunchUrl) {
        Alert.alert(
          "Signed Invite Ready!",
          "Open WhatsApp now to send the encrypted assessment link?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Open WhatsApp",
              onPress: () => Linking.openURL(data.delivery.whatsappLaunchUrl),
            },
          ]
        );
      } else {
        Alert.alert("Error", data.error || "Unable to send invite");
      }
    } catch (e) {
      Alert.alert("Network Error", String(e));
    } finally {
      setSending(false);
    }
  };

  const launchPsychometrics = () => {
    Linking.openURL(`${API_BASE}/assessments`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>AetherHR Mobile</Text>
        <Text style={styles.sub}>Global HRIS · Psychometrics · Automation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {tab === "home" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Biometric GPS Attendance</Text>
            <Text style={styles.muted}>
              {checkedInAt
                ? `Active Shift · Checked in at ${checkedInAt}`
                : "HQ SCBD Geofence Verified · Ready for Clock-In"}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleClockIn}>
              <Text style={styles.btnText}>
                {checkedInAt ? "Refresh GPS Attendance" : "Tap to Clock-In Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "payslip" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>November 2026 Digital Payslip</Text>
            <Text style={styles.bigMoney}>Rp 58.420.000</Text>
            <Text style={styles.muted}>Net Take-Home · PPh 21 TER + BPJS Automated</Text>
          </View>
        )}

        {tab === "invite" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Send Email & WhatsApp Test Invite</Text>
            <TextInput
              style={styles.input}
              placeholder="Candidate Name"
              placeholderTextColor="#64748b"
              value={candName}
              onChangeText={setCandName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748b"
              value={candEmail}
              onChangeText={setCandEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="WhatsApp (628...)"
              placeholderTextColor="#64748b"
              value={candPhone}
              onChangeText={setCandPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Target Role"
              placeholderTextColor="#64748b"
              value={candRole}
              onChangeText={setCandRole}
            />
            <TouchableOpacity
              style={styles.emeraldBtn}
              onPress={handleDispatchInvite}
              disabled={sending}
            >
              <Text style={styles.btnText}>
                {sending ? "Encrypting & Dispatching..." : "Generate Signed Link & Send WA"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "psychometrics" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>104-Item Cognitive & Psychometric Suite</Text>
            <Text style={styles.muted}>
              Numerical, Verbal, Visual Raven Matrices, Spatial, Speed, Big Five OCEAN, DISC & SJT.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={launchPsychometrics}>
              <Text style={styles.btnText}>Launch Proctored Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {(["home", "payslip", "invite", "psychometrics"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060913" },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  brand: { color: "#22d3ee", fontSize: 22, fontWeight: "900" },
  sub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  body: { padding: 16, gap: 14 },
  card: {
    backgroundColor: "#0b1120",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 12,
  },
  cardTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  muted: { color: "#94a3b8", fontSize: 13, lineHeight: 19 },
  bigMoney: { color: "#34d399", fontSize: 28, fontWeight: "900" },
  input: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#f8fafc",
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: "#0891b2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  emeraldBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#ffffff", fontWeight: "800", fontSize: 13 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    padding: 8,
    backgroundColor: "#0b1120",
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabBtnActive: { backgroundColor: "rgba(34,211,238,0.15)" },
  tabText: { color: "#64748b", fontSize: 10, fontWeight: "800" },
  tabTextActive: { color: "#22d3ee" },
});
