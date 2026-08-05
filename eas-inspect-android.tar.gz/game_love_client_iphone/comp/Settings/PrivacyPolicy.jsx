import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Divider, Text, Button } from 'react-native-paper';
import TopMenu from './TopMenu';
import { useLanguage } from '../../src/localization/LanguageContext';

const POLICY_CONTENT = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: March 29, 2026',
    intro:
      'Welcome to LoveGame. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.',
    back: 'Back',
    sections: [
      {
        title: '1. Information We Collect',
        body:
          'We collect information that you provide to us directly:\n\nMandatory Account Information: Name, email address, and age. This information is required to create and manage your account and ensure age-appropriate content.\n\nOptional User Data: You may choose to share information regarding your app interactions, such as cards you have completed, liked, or marked as favorites.\n\nFeedback: Any feedback or suggestions you voluntarily provide to improve the app experience.\n\nAuthentication Data: Information received from third-party login providers such as Google (via Firebase).',
      },
      {
        title: '2. How We Use Your Information',
        body:
          'We use the collected information to:\n\nCreate and secure your personal account.\n\nProvide and personalize the app experience based on your interactions.\n\nSave your progress (completed cards and favorites) across devices.\n\nImprove our services based on the feedback you choose to share.',
      },
      {
        title: '3. Third-Party Services',
        body:
          'We use Firebase Authentication (Google Login) to manage secure access to the app. These services may collect and process your data according to their own privacy policies. We do not share your personal data with any other third parties for marketing or advertising purposes.',
      },
      {
        title: '4. Data Storage and Security',
        body:
          "We take reasonable technical and organizational measures to protect your information. Your data is stored securely and is accessed only to provide the app's functionality.",
      },
      {
        title: '5. Data Sharing',
        body:
          'We do not sell, trade, or rent your personal information to others. Your data is used exclusively for the operation and improvement of LoveGame.',
      },
      {
        title: '6. User Rights & Data Deletion',
        body:
          'You have the right to access, update, or delete your personal information. You may request to delete your account and all associated data at any time through the app settings or by contacting us at the email below.',
      },
      {
        title: '7. Changes to This Policy',
        body:
          'We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this page.',
      },
      {
        title: '8. Contact Us',
        body:
          'If you have any questions or requests regarding your privacy, please contact us at:\nEmail: libaadmin@gmail.com',
      },
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新：2026年3月29日',
    intro:
      '欢迎使用 LoveGame。我们非常重视您的隐私。本隐私政策说明当您使用我们的移动应用时，我们如何收集、使用并保护您的信息。',
    back: '返回',
    sections: [
      {
        title: '1. 我们收集的信息',
        body:
          '我们会收集您直接提供给我们的信息：\n\n必填账户信息：姓名、电子邮箱和年龄。这些信息用于创建和管理您的账户，并确保向您展示适龄内容。\n\n可选用户数据：您可以选择分享与应用互动相关的信息，例如您完成、喜欢或标记为特别喜欢的卡片。\n\n反馈：您自愿提供的任何反馈或建议，用于改进应用体验。\n\n身份验证数据：来自第三方登录服务提供商（如 Google / Firebase）的信息。',
      },
      {
        title: '2. 我们如何使用您的信息',
        body:
          '我们使用收集到的信息来：\n\n创建并保护您的个人账户。\n\n根据您的互动为您提供个性化的应用体验。\n\n在不同设备间保存您的进度（已完成卡片和收藏）。\n\n根据您提供的反馈持续改进我们的服务。',
      },
      {
        title: '3. 第三方服务',
        body:
          '我们使用 Firebase Authentication（Google 登录）来管理应用的安全访问。这些服务可能会根据其各自的隐私政策收集和处理您的数据。除营销或广告目的外，我们不会将您的个人数据分享给其他第三方。',
      },
      {
        title: '4. 数据存储与安全',
        body:
          '我们采取合理的技术和组织措施来保护您的信息。您的数据会被安全存储，并仅在提供应用功能所需的范围内被访问。',
      },
      {
        title: '5. 数据共享',
        body:
          '我们不会出售、交易或出租您的个人信息。您的数据仅用于 LoveGame 的运营与改进。',
      },
      {
        title: '6. 用户权利与数据删除',
        body:
          '您有权访问、更新或删除您的个人信息。您可以随时通过应用设置或通过下方邮箱联系我们，申请删除您的账户及所有相关数据。',
      },
      {
        title: '7. 政策变更',
        body:
          '我们可能会不时更新本隐私政策。若有变更，我们会通过更新页面顶部的“最后更新”日期来通知您。',
      },
      {
        title: '8. 联系我们',
        body:
          '如果您对隐私有任何问题或请求，请通过以下方式联系我们：\n邮箱：libaadmin@gmail.com',
      },
    ],
  },
};

export default function PrivacyPolicy({ navigation }) {
  const { lang } = useLanguage();
  const content = POLICY_CONTENT[lang] || POLICY_CONTENT.en;

  return (
    <View style={styles.container}>
      <TopMenu navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.updated}>{content.updated}</Text>
          <Text style={styles.intro}>{content.intro}</Text>
        </View>

        {content.sections.map((section) => (
          <Card key={section.title} style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Divider style={styles.divider} />
              <Text style={styles.sectionBody}>{section.body}</Text>
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="outlined"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          {content.back}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
    paddingTop: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  updated: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  intro: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
  card: {
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    marginVertical: 10,
  },
  sectionBody: {
    fontSize: 14.5,
    lineHeight: 24,
    color: '#475569',
  },
  backButton: {
    marginTop: 8,
    borderRadius: 14,
    borderColor: '#CBD5E1',
  },
});
