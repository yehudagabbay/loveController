import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import { createPerfectDate, joinPerfectDate } from '../../../assets/utils/ApiTools';

const HOLD_DURATION_MS = 5000;

const VIBES = [
  { id: 'light', titleKey: 'perfectDate.vibes.light' },
  { id: 'deep', titleKey: 'perfectDate.vibes.deep' },
  { id: 'release', titleKey: 'perfectDate.vibes.release' },
];

const GOALS = [
  { id: 'appreciation', titleKey: 'perfectDate.goals.appreciation' },
  { id: 'fun', titleKey: 'perfectDate.goals.fun' },
  { id: 'intimacy', titleKey: 'perfectDate.goals.intimacy' },
  { id: 'future', titleKey: 'perfectDate.goals.future' },
];

const BOUNDARIES = [
  { id: 'no_work_money_tasks', titleKey: 'perfectDate.boundaries.noWorkMoneyTasks' },
  { id: 'no_active_tasks', titleKey: 'perfectDate.boundaries.noActiveTasks' },
  { id: 'no_past_conflicts', titleKey: 'perfectDate.boundaries.noPastConflicts' },
];

const QUESTION_STEPS = [
  {
    id: 'location',
    titleKey: 'perfectDate.questions.location.title',
    subtitleKey: 'perfectDate.questions.location.subtitle',
  },
  {
    id: 'role',
    titleKey: 'perfectDate.questions.role.title',
    subtitleKey: 'perfectDate.questions.role.subtitle',
  },
  {
    id: 'vibe',
    titleKey: 'perfectDate.questions.vibe.title',
    subtitleKey: 'perfectDate.questions.vibe.subtitle',
  },
  {
    id: 'goal',
    titleKey: 'perfectDate.questions.goal.title',
    subtitleKey: 'perfectDate.questions.goal.subtitle',
  },
  {
    id: 'boundaries',
    titleKey: 'perfectDate.questions.boundaries.title',
    subtitleKey: 'perfectDate.questions.boundaries.subtitle',
  },
];

const DEMO_TASKS = [
  {
    id: 1,
    labelKey: 'perfectDate.demoTasks.1.label',
    user1BackLabelKey: 'perfectDate.demoTasks.1.user1BackLabel',
    user2BackLabelKey: 'perfectDate.demoTasks.1.user2BackLabel',
    user1TextKey: 'perfectDate.demoTasks.1.user1Text',
    user2TextKey: 'perfectDate.demoTasks.1.user2Text',
  },
  {
    id: 2,
    user1BackLabelKey: 'perfectDate.demoTasks.2.user1BackLabel',
    user2BackLabelKey: 'perfectDate.demoTasks.2.user2BackLabel',
    user1LabelKey: 'perfectDate.demoTasks.2.user1Label',
    user1TextKey: 'perfectDate.demoTasks.2.user1Text',
    isUser1Secret: true,
    user2LabelKey: 'perfectDate.demoTasks.2.user2Label',
    user2TextKey: 'perfectDate.demoTasks.2.user2Text',
  },
  {
    id: 3,
    user1BackLabelKey: 'perfectDate.demoTasks.3.user1BackLabel',
    user2BackLabelKey: 'perfectDate.demoTasks.3.user2BackLabel',
    user1LabelKey: 'perfectDate.demoTasks.3.user1Label',
    user1TextKey: 'perfectDate.demoTasks.3.user1Text',
    user2LabelKey: 'perfectDate.demoTasks.3.user2Label',
    user2TextKey: 'perfectDate.demoTasks.3.user2Text',
    isUser2Secret: true,
  },
];

const ToggleChip = ({ active, label, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ActionButton = ({ label, icon, onPress, filled }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    style={[styles.actionButton, filled && styles.actionButtonFilled]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={18}
      color={filled ? '#FFFFFF' : '#7C2D12'}
    />
    <Text style={[styles.actionButtonText, filled && styles.actionButtonTextFilled]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function PerfectDateFlow({ navigation, route }) {
  const { lang } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);
  const userId = route?.params?.userId ?? null;
  const user = route?.params?.user ?? null;
  const incomingDateNumber = route?.params?.dateNumber ?? null;
  const [step, setStep] = useState('lobby');
  const [questionStep, setQuestionStep] = useState('location');
  const [dateNumber, setDateNumber] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [location, setLocation] = useState('home');
  const [role, setRole] = useState('user1');
  const [vibe, setVibe] = useState('light');
  const [goal, setGoal] = useState('intimacy');
  const [boundaries, setBoundaries] = useState(['no_work_money_tasks']);
  const [taskIndex, setTaskIndex] = useState(0);
  const [reaction, setReaction] = useState(null);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;

  const vibes = useMemo(
    () => VIBES.map((item) => ({ ...item, title: t(item.titleKey) })),
    [lang],
  );
  const goals = useMemo(
    () => GOALS.map((item) => ({ ...item, title: t(item.titleKey) })),
    [lang],
  );
  const boundaryOptions = useMemo(
    () => BOUNDARIES.map((item) => ({ ...item, title: t(item.titleKey) })),
    [lang],
  );
  const questionSteps = useMemo(
    () =>
      QUESTION_STEPS.map((item) => ({
        ...item,
        title: t(item.titleKey),
        subtitle: t(item.subtitleKey),
      })),
    [lang],
  );
  const demoTasks = useMemo(
    () =>
      DEMO_TASKS.map((item) => ({
        ...item,
        label: item.labelKey ? t(item.labelKey) : undefined,
        user1BackLabel: item.user1BackLabelKey ? t(item.user1BackLabelKey) : undefined,
        user2BackLabel: item.user2BackLabelKey ? t(item.user2BackLabelKey) : undefined,
        user1Label: item.user1LabelKey ? t(item.user1LabelKey) : undefined,
        user2Label: item.user2LabelKey ? t(item.user2LabelKey) : undefined,
        user1Text: item.user1TextKey ? t(item.user1TextKey) : undefined,
        user2Text: item.user2TextKey ? t(item.user2TextKey) : undefined,
      })),
    [lang],
  );

  const currentTask = demoTasks[taskIndex];
  const progressText = `${taskIndex + 1}/${demoTasks.length}`;
  const displayText = role === 'user1'
    ? currentTask?.user1Text
    : currentTask?.user2Text;
  const displayLabel = role === 'user1'
    ? currentTask?.user1Label || currentTask?.label
    : currentTask?.user2Label || currentTask?.label;
  const isSecret = role === 'user1'
    ? currentTask?.isUser1Secret
    : currentTask?.isUser2Secret;
  const cardBackLabel = role === 'user1'
    ? currentTask?.user1BackLabel
    : currentTask?.user2BackLabel;
  const questionStepIndex = questionSteps.findIndex((item) => item.id === questionStep);
  const safeQuestionStepIndex = questionStepIndex >= 0 ? questionStepIndex : 0;
  const currentQuestionStep = questionSteps[safeQuestionStepIndex];
  const questionProgress = (safeQuestionStepIndex + 1) / questionSteps.length;

  const scheduledDateNumber = useMemo(() => {
    if (dateNumber.trim()) return dateNumber.trim();
    return '4921';
  }, [dateNumber]);

  useEffect(() => {
    if (!incomingDateNumber) return;

    // קוד שהגיע מקישור הזמנה: ממלאים אוטומטית, אבל משאירים למשתמש אישור ידני.
    setDateNumber(String(incomingDateNumber).trim());
  }, [incomingDateNumber]);

  const toggleBoundary = (boundaryId) => {
    setBoundaries((prev) =>
      prev.includes(boundaryId)
        ? prev.filter((id) => id !== boundaryId)
        : [...prev, boundaryId],
    );
  };

  const enterQuestions = () => {
    setDateNumber((prev) => prev.trim() || '4921');
    setQuestionStep('location');
    setStep('questions');
  };

  const extractInviteData = (result) => {
    const data = result?.data || {};

    return {
      perfectDateID: data.perfectDateID ?? data.PerfectDateID,
      dateNumber: data.dateNumber ?? data.DateNumber,
      deepLink: data.deepLink ?? data.DeepLink,
      webInviteLink: data.webInviteLink ?? data.WebInviteLink,
      shareMessage: data.shareMessage ?? data.ShareMessage,
      status: data.status ?? data.Status,
    };
  };

  const handleCreatePerfectDate = async () => {
    setInviteError('');
    setInviteLoading(true);

    try {
      const result = await createPerfectDate({ userId });
      const nextInviteData = extractInviteData(result);

      setInviteData(nextInviteData);
      setDateNumber(String(nextInviteData.dateNumber || ''));
    } catch (error) {
      setInviteError(
        error?.message ||
          t('perfectDate.lobby.createError', {
            defaultValue: 'לא הצלחנו ליצור דייט חדש כרגע.',
          }),
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleJoinPerfectDate = async () => {
    const normalizedDateNumber = dateNumber.trim();

    if (!normalizedDateNumber) {
      setInviteError(
        t('perfectDate.lobby.missingCode', {
          defaultValue: 'צריך להזין קוד דייט.',
        }),
      );
      return;
    }

    setInviteError('');
    setInviteLoading(true);

    try {
      const result = await joinPerfectDate({
        dateNumber: normalizedDateNumber,
        userId,
      });

      setInviteData(extractInviteData(result));
      enterQuestions();
    } catch (error) {
      setInviteError(
        error?.message ||
          t('perfectDate.lobby.joinError', {
            defaultValue: 'לא הצלחנו להצטרף לדייט הזה.',
          }),
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const sharePerfectDateInvite = async () => {
    const normalizedDateNumber = dateNumber.trim();
    const fallbackLink = `https://libagame.somee.com/perfect-date/${normalizedDateNumber}`;
    const fallbackMessage = t('perfectDate.invite.shareMessage', {
      defaultValue: 'הזמנתי אותך לדייט המושלם.\nקוד הדייט: {{code}}\nלחיצה להצטרפות: {{link}}',
      code: normalizedDateNumber,
      link: inviteData?.webInviteLink || fallbackLink,
    });

    await Share.share({
      message: inviteData?.shareMessage || fallbackMessage,
    }).catch(() => {});
  };

  const goQuestionBack = () => {
    if (safeQuestionStepIndex === 0) {
      setStep('lobby');
      return;
    }

    setQuestionStep(questionSteps[safeQuestionStepIndex - 1].id);
  };

  const goQuestionNext = () => {
    if (safeQuestionStepIndex >= questionSteps.length - 1) {
      setStep('saved');
      return;
    }

    setQuestionStep(questionSteps[safeQuestionStepIndex + 1].id);
  };

  const startHold = () => {
    holdProgress.setValue(0);
    Haptics.selectionAsync().catch(() => {});

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setReaction(null);
      setIsCardRevealed(false);
      setStep('card');
    });
  };

  const cancelHold = () => {
    holdProgress.stopAnimation();
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (taskIndex >= demoTasks.length - 1) {
      setStep('done');
      return;
    }
    setTaskIndex((prev) => prev + 1);
    setReaction(null);
    setIsCardRevealed(false);
    setStep('launch');
  };

  const shareTask = async () => {
    if (!displayText) return;
    await Share.share({
      message: t('perfectDate.share.message', {
        label: displayLabel || t('perfectDate.card.defaultTitle'),
        text: displayText,
      }),
    }).catch(() => {});
  };

  const renderHeader = (subtitle) => (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <MaterialCommunityIcons name="chevron-right" size={26} color="#7C2D12" />
      </TouchableOpacity>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>{t('perfectDate.title')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderQuestionChoices = () => {
    if (questionStep === 'location') {
      return (
        <View style={styles.choiceStack}>
          <ToggleChip label={t('perfectDate.location.home')} active={location === 'home'} onPress={() => setLocation('home')} />
          <ToggleChip label={t('perfectDate.location.out')} active={location === 'out'} onPress={() => setLocation('out')} />
        </View>
      );
    }

    if (questionStep === 'role') {
      return (
        <View style={styles.choiceStack}>
          <ToggleChip label={t('perfectDate.roles.user1')} active={role === 'user1'} onPress={() => setRole('user1')} />
          <ToggleChip label={t('perfectDate.roles.user2')} active={role === 'user2'} onPress={() => setRole('user2')} />
        </View>
      );
    }

    if (questionStep === 'vibe') {
      return (
        <View style={styles.choiceStack}>
          {vibes.map((item) => (
            <ToggleChip key={item.id} label={item.title} active={vibe === item.id} onPress={() => setVibe(item.id)} />
          ))}
        </View>
      );
    }

    if (questionStep === 'goal') {
      return (
        <View style={styles.choiceStack}>
          {goals.map((item) => (
            <ToggleChip key={item.id} label={item.title} active={goal === item.id} onPress={() => setGoal(item.id)} />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.choiceStack}>
        {boundaryOptions.map((item) => (
          <ToggleChip
            key={item.id}
            label={item.title}
            active={boundaries.includes(item.id)}
            onPress={() => toggleBoundary(item.id)}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFF7ED', '#FFE4E6', '#FEF3C7']} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        {step === 'lobby' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderHeader(t('perfectDate.lobby.header'))}

            <View style={styles.heroBox}>
              <MaterialCommunityIcons name="calendar-heart" size={46} color="#DB2777" />
              <Text style={styles.heroTitle}>{t('perfectDate.lobby.heroTitle')}</Text>
              <Text style={styles.heroText}>
                {t('perfectDate.lobby.heroText')}
              </Text>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>{t('perfectDate.lobby.codeLabel')}</Text>
              <TextInput
                value={dateNumber}
                onChangeText={setDateNumber}
                keyboardType="number-pad"
                maxLength={6}
                placeholder={t('perfectDate.lobby.codePlaceholder')}
                placeholderTextColor="#B45309"
                style={styles.textInput}
                textAlign="center"
              />
            </View>

            {inviteError ? (
              <Text style={styles.errorText}>{inviteError}</Text>
            ) : null}

            {inviteData?.dateNumber ? (
              <View style={styles.inviteCard}>
                <Text style={styles.inviteLabel}>{t('perfectDate.invite.codeLabel', { defaultValue: 'קוד הדייט שלך' })}</Text>
                <Text style={styles.inviteCode}>{inviteData.dateNumber}</Text>
                <Text style={styles.inviteText}>
                  {t('perfectDate.invite.text', {
                    defaultValue: 'שלחו את הקישור לבן/בת הזוג. אם האפליקציה מותקנת, הקוד ייכנס אוטומטית.',
                  })}
                </Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={sharePerfectDateInvite}>
                  <Text style={styles.secondaryButtonText}>{t('perfectDate.invite.shareButton', { defaultValue: 'שתף הזמנה' })}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, inviteLoading && styles.buttonDisabled]}
              onPress={handleCreatePerfectDate}
              disabled={inviteLoading}
            >
              <Text style={styles.primaryButtonText}>
                {inviteLoading
                  ? t('perfectDate.lobby.loading', { defaultValue: 'רגע...' })
                  : t('perfectDate.lobby.createButton')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, inviteLoading && styles.buttonDisabled]}
              onPress={handleJoinPerfectDate}
              disabled={inviteLoading}
            >
              <Text style={styles.secondaryButtonText}>{t('perfectDate.lobby.joinButton')}</Text>
            </TouchableOpacity>
            {inviteData?.dateNumber ? (
              <TouchableOpacity style={styles.primaryButton} onPress={enterQuestions}>
                <Text style={styles.primaryButtonText}>{t('perfectDate.invite.continueButton', { defaultValue: 'המשך לשאלון' })}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        )}

        {step === 'questions' && (
          <View style={styles.questionScreen}>
            {renderHeader(t('perfectDate.questions.header', { number: scheduledDateNumber }))}

            <View style={styles.progressWrap}>
              <View style={styles.progressMeta}>
                <Text style={styles.progressLabel}>
                  {t('perfectDate.questions.progress', {
                    current: safeQuestionStepIndex + 1,
                    total: questionSteps.length,
                  })}
                </Text>
                <Text style={styles.progressPercent}>{Math.round(questionProgress * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${questionProgress * 100}%` }]} />
              </View>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionTitle}>{currentQuestionStep.title}</Text>
              <Text style={styles.questionSubtitle}>{currentQuestionStep.subtitle}</Text>
              {renderQuestionChoices()}
            </View>

            <View style={styles.questionActions}>
              <TouchableOpacity style={styles.questionBackButton} onPress={goQuestionBack}>
                <Text style={styles.questionBackText}>{t('perfectDate.actions.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.questionNextButton} onPress={goQuestionNext}>
                <Text style={styles.questionNextText}>
                  {safeQuestionStepIndex === questionSteps.length - 1
                    ? t('perfectDate.actions.saveQuestionnaire')
                    : t('perfectDate.actions.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'saved' && (
          <View style={styles.centerContent}>
            {renderHeader(t('perfectDate.saved.header'))}
            <View style={styles.savedCard}>
              <Text style={styles.savedNumber}>{scheduledDateNumber}</Text>
              <Text style={styles.savedTitle}>{t('perfectDate.saved.title')}</Text>
              <Text style={styles.savedText}>
                {t('perfectDate.saved.text')}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('launch')}>
              <Text style={styles.primaryButtonText}>{t('perfectDate.saved.launchButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('questions')}>
              <Text style={styles.secondaryButtonText}>{t('perfectDate.saved.editButton')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'launch' && (
          <View style={styles.launchContent}>
            {renderHeader(t('perfectDate.launch.header', { progress: progressText }))}
            <Text style={styles.launchTitle}>{t('perfectDate.launch.title')}</Text>
            <Text style={styles.launchText}>
              {t('perfectDate.launch.text')}
            </Text>

            <Pressable onPressIn={startHold} onPressOut={cancelHold} style={styles.holdButtonOuter}>
              <Animated.View
                style={[
                  styles.holdProgress,
                  {
                    transform: [
                      {
                        scale: holdProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.05, 1],
                        }),
                      },
                    ],
                    opacity: holdProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.92],
                    }),
                  },
                ]}
              />
              <View style={styles.holdButtonInner}>
                <MaterialCommunityIcons name="cards-heart" size={42} color="#FFFFFF" />
                <Text style={styles.holdButtonText}>{t('perfectDate.launch.holdButton')}</Text>
              </View>
            </Pressable>
          </View>
        )}

        {step === 'card' && currentTask && (
          <View style={styles.cardContent}>
            {renderHeader(t('perfectDate.card.header', { progress: progressText }))}
            <View style={[styles.dateCard, !isCardRevealed && styles.cardBack, isCardRevealed && isSecret && styles.secretCard]}>
              {!isCardRevealed ? (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => setIsCardRevealed(true)}
                  style={styles.cardBackContent}
                >
                  <View style={styles.cardBackIconWrap}>
                    <MaterialCommunityIcons name="cards-heart" size={42} color="#DB2777" />
                  </View>
                  <Text style={styles.cardBackEyebrow}>{t('perfectDate.card.nextEyebrow')}</Text>
                  <Text style={styles.cardBackTitle}>{cardBackLabel || t('perfectDate.card.defaultCoupleCard')}</Text>
                  <Text style={styles.cardBackHint}>{t('perfectDate.card.tapToReveal')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardPill}>
                      {isSecret ? t('perfectDate.card.secretPill') : displayLabel || t('perfectDate.card.sharedMoment')}
                    </Text>
                    <Text style={styles.cardCounter}>{progressText}</Text>
                  </View>
                  <ScrollView contentContainerStyle={styles.cardTextWrap}>
                    <Text style={styles.dateCardText}>{displayText}</Text>
                  </ScrollView>
                </>
              )}
            </View>

            {isCardRevealed ? (
              <>
                <View style={styles.reactionRow}>
                  <ActionButton
                    label={t('perfectDate.reactions.like')}
                    icon="heart-outline"
                    filled={reaction === 'like'}
                    onPress={() => setReaction(reaction === 'like' ? null : 'like')}
                  />
                  <ActionButton
                    label={t('perfectDate.reactions.love')}
                    icon="heart-multiple"
                    filled={reaction === 'love'}
                    onPress={() => setReaction(reaction === 'love' ? null : 'love')}
                  />
                </View>
                <View style={styles.reactionRow}>
                  <ActionButton label={t('perfectDate.actions.done')} icon="check-bold" filled onPress={handleDone} />
                  <ActionButton label={t('perfectDate.actions.share')} icon="share-variant" onPress={shareTask} />
                </View>
              </>
            ) : (
              <View style={styles.revealActions}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.revealButton}
                  onPress={() => setIsCardRevealed(true)}
                >
                  <Text style={styles.revealButtonText}>{t('perfectDate.card.revealButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {step === 'done' && (
          <View style={styles.centerContent}>
            {renderHeader(t('perfectDate.done.header'))}
            <View style={styles.savedCard}>
              <MaterialCommunityIcons name="heart-check" size={56} color="#DB2777" />
              <Text style={styles.savedTitle}>{t('perfectDate.done.title')}</Text>
              <Text style={styles.savedText}>
                {t('perfectDate.done.text')}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('GameModeSelect', { userId, user })}>
              <Text style={styles.primaryButtonText}>{t('perfectDate.done.backHome')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 32 },
  questionScreen: {
    flex: 1,
    padding: 18,
  },
  centerContent: { flex: 1, padding: 18, justifyContent: 'center' },
  launchContent: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  header: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 18 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.22)',
  },
  headerTextWrap: { flex: 1, alignItems: 'flex-end', paddingRight: 12 },
  title: { fontSize: 27, fontWeight: '900', color: '#7C2D12', textAlign: 'right' },
  subtitle: { marginTop: 4, fontSize: 14, fontWeight: '700', color: '#9A3412', textAlign: 'right' },
  heroBox: {
    minHeight: 190,
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.26)',
    marginBottom: 18,
  },
  heroTitle: { marginTop: 12, fontSize: 23, fontWeight: '900', color: '#831843', textAlign: 'center' },
  heroText: { marginTop: 10, fontSize: 15, lineHeight: 23, color: '#7C2D12', textAlign: 'center', fontWeight: '600' },
  inputBox: { marginBottom: 14 },
  inputLabel: { fontSize: 14, color: '#7C2D12', fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  textInput: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.28)',
    fontSize: 22,
    fontWeight: '900',
    color: '#7C2D12',
    paddingHorizontal: 16,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#DB2777',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#831843',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.28)',
  },
  secondaryButtonText: { color: '#7C2D12', fontSize: 16, fontWeight: '900' },
  buttonDisabled: {
    opacity: 0.62,
  },
  errorText: {
    color: '#991B1B',
    backgroundColor: 'rgba(254,226,226,0.86)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  inviteCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(219,39,119,0.22)',
    marginBottom: 4,
    alignItems: 'center',
  },
  inviteLabel: {
    color: '#7C2D12',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  inviteCode: {
    color: '#DB2777',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 5,
    marginTop: 4,
  },
  inviteText: {
    color: '#9A3412',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  progressWrap: {
    marginBottom: 16,
  },
  progressMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#7C2D12',
    fontSize: 13,
    fontWeight: '900',
  },
  progressPercent: {
    color: '#DB2777',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.76)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#DB2777',
  },
  questionCard: {
    flex: 1,
    borderRadius: 30,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.22)',
    justifyContent: 'center',
    shadowColor: '#831843',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  questionTitle: {
    color: '#7C2D12',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  questionSubtitle: {
    color: '#9A3412',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 22,
  },
  choiceStack: {
    width: '100%',
    gap: 10,
  },
  questionActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 16,
  },
  questionNextButton: {
    flex: 1.35,
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: '#DB2777',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#831843',
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  questionNextText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  questionBackButton: {
    flex: 0.85,
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionBackText: {
    color: '#7C2D12',
    fontSize: 16,
    fontWeight: '900',
  },
  section: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.18)',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#7C2D12', textAlign: 'right', marginBottom: 10 },
  row: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: 44,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.22)',
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  chipActive: { backgroundColor: '#FECDD3', borderColor: '#DB2777' },
  chipText: { color: '#7C2D12', fontSize: 14, fontWeight: '800', textAlign: 'right' },
  chipTextActive: { color: '#831843' },
  savedCard: {
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.24)',
    marginBottom: 18,
  },
  savedNumber: { fontSize: 48, letterSpacing: 5, fontWeight: '900', color: '#DB2777' },
  savedTitle: { marginTop: 12, fontSize: 23, fontWeight: '900', color: '#7C2D12', textAlign: 'center' },
  savedText: { marginTop: 10, fontSize: 15, lineHeight: 24, fontWeight: '600', color: '#9A3412', textAlign: 'center' },
  launchTitle: { fontSize: 32, fontWeight: '900', color: '#7C2D12', textAlign: 'center', marginTop: 18 },
  launchText: {
    marginTop: 10,
    marginBottom: 34,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
    color: '#9A3412',
    textAlign: 'center',
    maxWidth: 340,
  },
  holdButtonOuter: {
    width: 224,
    height: 224,
    borderRadius: 112,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 2,
    borderColor: 'rgba(219,39,119,0.24)',
    overflow: 'hidden',
  },
  holdProgress: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: '#DB2777',
  },
  holdButtonInner: {
    width: 154,
    height: 154,
    borderRadius: 77,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB2777',
  },
  holdButtonText: { color: '#FFFFFF', marginTop: 8, fontSize: 18, fontWeight: '900' },
  dateCard: {
    flex: 1,
    maxHeight: 520,
    borderRadius: 32,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.25)',
    shadowColor: '#831843',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  cardBack: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(219,39,119,0.28)',
    justifyContent: 'center',
  },
  cardBackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  cardBackIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: 'rgba(219,39,119,0.18)',
    marginBottom: 22,
  },
  cardBackEyebrow: {
    color: '#9A3412',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardBackTitle: {
    color: '#7C2D12',
    fontSize: 34,
    lineHeight: 43,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardBackHint: {
    marginTop: 18,
    color: '#DB2777',
    fontSize: 15,
    fontWeight: '900',
  },
  secretCard: { backgroundColor: 'rgba(255,241,242,0.92)', borderColor: 'rgba(219,39,119,0.36)' },
  cardTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardPill: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#FECDD3',
    paddingVertical: 7,
    paddingHorizontal: 12,
    color: '#831843',
    fontSize: 13,
    fontWeight: '900',
  },
  cardCounter: { fontSize: 13, fontWeight: '900', color: '#9A3412' },
  cardTextWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  dateCardText: { fontSize: 25, lineHeight: 38, color: '#431407', fontWeight: '800', textAlign: 'center' },
  revealActions: {
    marginTop: 12,
  },
  revealButton: {
    minHeight: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB2777',
    shadowColor: '#831843',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  reactionRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 10 },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.28)',
  },
  actionButtonFilled: { backgroundColor: '#DB2777', borderColor: '#DB2777' },
  actionButtonText: { color: '#7C2D12', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  actionButtonTextFilled: { color: '#FFFFFF' },
});
