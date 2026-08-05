import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import {
  createPerfectDate,
  fetchPerfectDateDeck,
  fetchPerfectDateState,
  joinPerfectDate,
  markPerfectDateTaskRevealReady,
  markPerfectDateTaskReady,
  savePerfectDateSetup,
} from '../../../assets/utils/ApiTools';
import PerfectDateShareCard from './PerfectDateShareCard';

const HOLD_DURATION_MS = 5000;
const SCREEN_SLIDE_DISTANCE = 520;

const VIBES = [
  { id: 'light', titleKey: 'perfectDate.vibes.light', icon: 'emoticon-happy-outline' },
  { id: 'deep', titleKey: 'perfectDate.vibes.deep', icon: 'heart-outline' },
  { id: 'release', titleKey: 'perfectDate.vibes.release', icon: 'weather-windy' },
];

const GOALS = [
  { id: 'appreciation', titleKey: 'perfectDate.goals.appreciation', icon: 'hand-heart-outline' },
  { id: 'fun', titleKey: 'perfectDate.goals.fun', icon: 'party-popper' },
  { id: 'intimacy', titleKey: 'perfectDate.goals.intimacy', icon: 'heart-multiple-outline' },
  { id: 'future', titleKey: 'perfectDate.goals.future', icon: 'rocket-launch-outline' },
];

const BOUNDARIES = [
  { id: 'no_work_money', titleKey: 'perfectDate.boundaries.noWorkMoney', icon: 'briefcase-off-outline' },
  { id: 'no_future_talk', titleKey: 'perfectDate.boundaries.noFutureTalk', icon: 'rocket-launch-outline' },
  { id: 'no_heavy_past', titleKey: 'perfectDate.boundaries.noHeavyPast', icon: 'history' },
  { id: 'no_physical', titleKey: 'perfectDate.boundaries.noPhysical', icon: 'hand-back-left-off-outline' },
];

const GENDER_OPTIONS = [
  { id: 'Male', titleKey: 'perfectDate.gender.male', icon: 'face-man-outline' },
  { id: 'Female', titleKey: 'perfectDate.gender.female', icon: 'face-woman-outline' },
];

const QUESTION_STEPS = [
  {
    id: 'location',
    titleKey: 'perfectDate.questions.location.title',
    subtitleKey: 'perfectDate.questions.location.subtitle',
  },
  {
    id: 'gender',
    titleKey: 'perfectDate.questions.gender.title',
    subtitleKey: 'perfectDate.questions.gender.subtitle',
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

const ToggleChip = ({ active, icon, label, onPress }) => {
  const scale = useRef(new Animated.Value(active ? 1.02 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.025 : 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Animated.View
        style={[
          styles.choiceCard,
          active && styles.choiceCardActive,
          { transform: [{ scale }] },
        ]}
      >
        <LinearGradient
          colors={active ? ['#BE185D', '#E85D8A'] : ['#FFFFFF', '#FFF7FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.choiceGradient}
        >
          <View style={[styles.choiceIconWrap, active && styles.choiceIconWrapActive]}>
            <MaterialCommunityIcons
              name={icon || 'heart-outline'}
              size={24}
              color={active ? '#BE185D' : '#9F3954'}
            />
          </View>
          <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
            {label}
          </Text>
          <View style={[styles.choiceCheck, active && styles.choiceCheckActive]}>
            <MaterialCommunityIcons
              name={active ? 'check-bold' : 'plus'}
              size={16}
              color={active ? '#BE185D' : '#9F3954'}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const ActionButton = ({ label, icon, onPress, filled, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    disabled={disabled}
    style={[styles.actionButton, filled && styles.actionButtonFilled, disabled && styles.actionButtonDisabled]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={18}
      color={filled ? '#FFFFFF' : '#5B1B2E'}
    />
    <Text style={[styles.actionButtonText, filled && styles.actionButtonTextFilled]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function PerfectDateFlow({ navigation, route }) {
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomSafePadding = Math.max(insets.bottom + 18, 52);
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
  const [setupLoading, setSetupLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [location, setLocation] = useState('home');
  const [exactLocation, setExactLocation] = useState('');
  const [role, setRole] = useState('user1');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState(() => {
    const initialAge = user?.age ?? user?.Age;
    return initialAge ? String(initialAge) : '';
  });
  const [vibe, setVibe] = useState('light');
  const [goal, setGoal] = useState('intimacy');
  const [boundaries, setBoundaries] = useState(['no_work_money']);
  const [serverDeckTasks, setServerDeckTasks] = useState([]);
  const [deckLoading, setDeckLoading] = useState(false);
  const [deckError, setDeckError] = useState('');
  const [taskIndex, setTaskIndex] = useState(0);
  const [reaction, setReaction] = useState(null);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [syncState, setSyncState] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [launchReadyLoading, setLaunchReadyLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const holdProgress = useRef(new Animated.Value(0)).current;
  const screenMotion = useRef(new Animated.Value(1)).current;
  const screenTransitionDirection = useRef(1);
  const questionMotion = useRef(new Animated.Value(1)).current;
  const questionTransitionDirection = useRef(1);
  const questionSwipeX = useRef(new Animated.Value(0)).current;
  const perfectDateShareRef = useRef(null);

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
  const genderOptions = useMemo(
    () => GENDER_OPTIONS.map((item) => ({ ...item, title: t(item.titleKey) })),
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

  const activeTasks = serverDeckTasks.length > 0 ? serverDeckTasks : demoTasks;
  const currentTask = activeTasks[taskIndex];
  const progressText = `${taskIndex + 1}/${activeTasks.length}`;
  const isServerDeck = serverDeckTasks.length > 0;
  const isWaitingForPartner =
    isServerDeck &&
    syncState?.currentUserReady &&
    !syncState?.isCompleted &&
    syncState?.currentSequenceNumber === taskIndex + 1;
  const isPartnerWaiting =
    isServerDeck &&
    syncState?.partnerReady &&
    !syncState?.currentUserReady &&
    !syncState?.isCompleted &&
    syncState?.currentSequenceNumber === taskIndex + 1;
  const isWaitingToReveal =
    isServerDeck &&
    syncState?.currentUserRevealReady &&
    !syncState?.isCurrentTaskRevealed &&
    !syncState?.isCompleted &&
    syncState?.currentSequenceNumber === taskIndex + 1;
  const isPartnerWaitingToReveal =
    isServerDeck &&
    syncState?.partnerRevealReady &&
    !syncState?.currentUserRevealReady &&
    !syncState?.isCurrentTaskRevealed &&
    !syncState?.isCompleted &&
    syncState?.currentSequenceNumber === taskIndex + 1;
  const displayText = currentTask?.contentText || (
    role === 'user1'
      ? currentTask?.user1Text
      : currentTask?.user2Text
  );
  const displayLabel = currentTask?.label || (
    role === 'user1'
      ? currentTask?.user1Label || currentTask?.label
      : currentTask?.user2Label || currentTask?.label
  );
  const isSecret = currentTask?.isSecret ?? (
    role === 'user1'
      ? currentTask?.isUser1Secret
      : currentTask?.isUser2Secret
  );
  const cardBackLabel = currentTask?.backLabel || (
    role === 'user1'
      ? currentTask?.user1BackLabel
      : currentTask?.user2BackLabel
  );
  const questionStepIndex = questionSteps.findIndex((item) => item.id === questionStep);
  const safeQuestionStepIndex = questionStepIndex >= 0 ? questionStepIndex : 0;
  const currentQuestionStep = questionSteps[safeQuestionStepIndex];
  const questionProgress = (safeQuestionStepIndex + 1) / questionSteps.length;
  const hasAge = age.trim().length > 0;
  const ageNumber = Number.parseInt(age, 10);
  const isAgeValid = !hasAge || (
    /^\d{1,3}$/.test(age.trim()) &&
    ageNumber >= 18 &&
    ageNumber <= 120
  );
  const hasValidAge = hasAge && isAgeValid;

  const scheduledDateNumber = useMemo(() => {
    if (dateNumber.trim()) return dateNumber.trim();
    return String(inviteData?.dateNumber || '').trim();
  }, [dateNumber, inviteData?.dateNumber]);
  const participantAccessToken = useMemo(
    () => String(inviteData?.participantAccessToken || '').trim(),
    [inviteData?.participantAccessToken],
  );

  const currentSelectionLabel = useMemo(() => {
    if (questionStep === 'location') {
      return location === 'home'
        ? t('perfectDate.location.home')
        : t('perfectDate.location.out');
    }

    if (questionStep === 'gender') {
      const genderLabel = genderOptions.find((item) => item.id === gender)?.title || '';
      return genderLabel && hasValidAge
        ? `${genderLabel}, ${t('perfectDate.gender.ageSummary', { age: ageNumber })}`
        : genderLabel;
    }

    if (questionStep === 'vibe') {
      return vibes.find((item) => item.id === vibe)?.title || '';
    }

    if (questionStep === 'goal') {
      return goals.find((item) => item.id === goal)?.title || '';
    }

    const selectedBoundaries = boundaryOptions
      .filter((item) => boundaries.includes(item.id))
      .map((item) => item.title)
      .join(', ');

    return selectedBoundaries || t('perfectDate.questions.noSpecialBoundaries');
  }, [ageNumber, boundaryOptions, boundaries, gender, genderOptions, goal, goals, hasValidAge, location, questionStep, t, vibe, vibes]);

  const hasCurrentSelection = questionStep !== 'gender' || (Boolean(gender) && hasValidAge);
  const getSetupErrorMessage = (error) => {
    const message = String(error?.message || '');
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('same perfect date location')) {
      return t('perfectDate.errors.locationMismatch', {
        defaultValue: lang === 'he'
          ? 'שני הצדדים צריכים לבחור אותו סוג מיקום לדייט.'
          : 'Both partners need to choose the same date location.',
      });
    }

    if (lowerMessage.includes('questionnaire cannot be changed')) {
      return t('perfectDate.errors.setupLocked', {
        defaultValue: lang === 'he'
          ? 'אי אפשר לשנות את השאלון אחרי שהדייט התחיל.'
          : 'The questionnaire cannot be changed after the date starts.',
      });
    }

    return message || t('perfectDate.errors.saveFailed');
  };
  const getDeckErrorMessage = (error) => {
    const message = String(error?.message || '');

    if (message.toLowerCase().includes('both partners must complete the questionnaire')) {
      return t('perfectDate.errors.partnerSetupPending', {
        defaultValue: lang === 'he'
          ? 'מחכים שגם הצד השני יסיים את השאלון לפני שמתחילים.'
          : 'Waiting for your partner to finish the questionnaire before launch.',
      });
    }

    return message || t('perfectDate.errors.deckFailed');
  };

  useEffect(() => {
    if (!incomingDateNumber) return;

    // קוד שהגיע מקישור הזמנה: ממלאים אוטומטית, אבל משאירים למשתמש אישור ידני.
    setDateNumber(String(incomingDateNumber).trim());
  }, [incomingDateNumber]);

  const playScreenSlideIn = (direction = 1) => {
    screenTransitionDirection.current = direction;
    screenMotion.stopAnimation();
    screenMotion.setValue(0);
    Animated.timing(screenMotion, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const goToStep = (nextStep, direction = 1) => {
    playScreenSlideIn(direction);
    setStep(nextStep);
  };

  const goToQuestionStep = (nextQuestionStep, direction = 1) => {
    questionTransitionDirection.current = direction;
    questionSwipeX.setValue(0);
    setQuestionStep(nextQuestionStep);
  };

  useEffect(() => {
    if (step !== 'questions') {
      return;
    }

    questionMotion.stopAnimation();
    questionMotion.setValue(0);
    questionSwipeX.setValue(0);
    Animated.timing(questionMotion, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [questionMotion, questionStep, questionSwipeX, step]);

  const toggleBoundary = (boundaryId) => {
    setBoundaries((prev) =>
      prev.includes(boundaryId)
        ? prev.filter((id) => id !== boundaryId)
        : [...prev, boundaryId],
    );
  };

  const enterQuestions = () => {
    setQuestionError('');
    goToQuestionStep('location', 1);
    goToStep('questions', 1);
  };

    // בחירת השפה משתמשת במנגנון הכללי של האפליקציה, ולכן כל הדייט מתורגם מיד.
  const extractInviteData = (result) => {
    const data = result?.data || {};

    return {
      perfectDateID: data.perfectDateID ?? data.PerfectDateID,
      dateNumber: data.dateNumber ?? data.DateNumber,
      participantRole: data.participantRole ?? data.ParticipantRole,
      participantAccessToken:
        data.participantAccessToken ??
        data.ParticipantAccessToken ??
        data.accessToken ??
        data.AccessToken,
      deepLink: data.deepLink ?? data.DeepLink,
      webInviteLink: data.webInviteLink ?? data.WebInviteLink,
      shareMessage: data.shareMessage ?? data.ShareMessage,
      status: data.status ?? data.Status,
    };
  };

  const extractDeckTasks = (result) => {
    const data = Array.isArray(result?.data) ? result.data : [];

    return data.map((item, index) => ({
      id: item.cardID ?? item.CardID ?? index + 1,
      perfectDateTaskId: item.perfectDateTaskID ?? item.PerfectDateTaskID,
      sequenceNumber: item.sequenceNumber ?? item.SequenceNumber ?? index + 1,
      cardType: item.cardType ?? item.CardType ?? 1,
      backLabel: item.backLabel ?? item.BackLabel,
      label: item.label ?? item.Label,
      contentText: resolveDeckCardText(item),
      contentMaleSecret: item.contentMaleSecret ?? item.ContentMaleSecret,
      contentFemaleSecret: item.contentFemaleSecret ?? item.ContentFemaleSecret,
      currentUserGender: item.currentUserGender ?? item.CurrentUserGender,
      isSecret: Boolean(item.isSecret ?? item.IsSecret),
    }));
  };

  const extractSyncState = (result) => {
    const data = result?.data || {};

    return {
      currentTaskId: data.currentTaskID ?? data.CurrentTaskID ?? null,
      currentSequenceNumber: data.currentSequenceNumber ?? data.CurrentSequenceNumber ?? 1,
      totalTasks: data.totalTasks ?? data.TotalTasks ?? activeTasks.length,
      currentUserReady: Boolean(data.currentUserReady ?? data.CurrentUserReady),
      partnerReady: Boolean(data.partnerReady ?? data.PartnerReady),
      currentUserRevealReady: Boolean(data.currentUserRevealReady ?? data.CurrentUserRevealReady),
      partnerRevealReady: Boolean(data.partnerRevealReady ?? data.PartnerRevealReady),
      isCurrentTaskRevealed: Boolean(data.isCurrentTaskRevealed ?? data.IsCurrentTaskRevealed),
      isCompleted: Boolean(data.isCompleted ?? data.IsCompleted),
    };
  };

  const resolveDeckCardText = (item) => {
    const cardType = item.cardType ?? item.CardType ?? 1;

    if (cardType !== 3) {
      return item.contentText ?? item.ContentText ?? '';
    }

    const directSecretText = item.contentText ?? item.ContentText;
    if (directSecretText) {
      return directSecretText;
    }

    const currentUserGender = item.currentUserGender ?? item.CurrentUserGender;
    const maleSecret = item.contentMaleSecret ?? item.ContentMaleSecret;
    const femaleSecret = item.contentFemaleSecret ?? item.ContentFemaleSecret;
    const selectedSecret = currentUserGender === 'M' ? maleSecret : femaleSecret;

    return selectedSecret || t('perfectDate.card.secretFallback');
  };

  const loadPerfectDateDeck = async () => {
    if (!scheduledDateNumber) return false;

    setDeckLoading(true);
    setDeckError('');

    try {
      const result = await fetchPerfectDateDeck({
        dateNumber: scheduledDateNumber,
        accessToken: participantAccessToken,
        userId,
        participantRole: role,
        languageCode: lang,
      });
      const nextDeckTasks = extractDeckTasks(result);

      if (nextDeckTasks.length === 0) {
        setServerDeckTasks([]);
        setDeckError(
          t('perfectDate.errors.deckEmpty', {
            defaultValue: lang === 'he'
              ? 'לא נמצאו משימות מתאימות לדייט הזה.'
              : 'No matching tasks were found for this date.',
          }),
        );
        return false;
      }

      setServerDeckTasks(nextDeckTasks);
      const stateResult = await fetchPerfectDateState({
        dateNumber: scheduledDateNumber,
        accessToken: participantAccessToken,
        userId,
        participantRole: role,
        languageCode: lang,
      });
      const nextSyncState = extractSyncState(stateResult);

      setSyncState(nextSyncState);
      if (nextSyncState.isCompleted) {
        goToStep('done', 1);
      } else {
        const nextIndex = Math.max(
          0,
          Math.min(nextDeckTasks.length - 1, Number(nextSyncState.currentSequenceNumber || 1) - 1),
        );
        setTaskIndex(nextIndex);
      }

      return true;
    } catch (error) {
      setDeckError(getDeckErrorMessage(error));
      return false;
    } finally {
      setDeckLoading(false);
    }
  };

  const syncPerfectDateState = async (silent = false) => {
    if (!isServerDeck || !scheduledDateNumber || !participantAccessToken) {
      return null;
    }

    if (!silent) {
      setSyncLoading(true);
    }
    setSyncError('');

    try {
      const result = await fetchPerfectDateState({
        dateNumber: scheduledDateNumber,
        accessToken: participantAccessToken,
        userId,
        participantRole: role,
        languageCode: lang,
      });
      const nextSyncState = extractSyncState(result);
      const nextSequence = Number(nextSyncState.currentSequenceNumber || 1);

      setSyncState(nextSyncState);

      if (nextSyncState.isCompleted) {
        goToStep('done', 1);
        return nextSyncState;
      }

      if (nextSequence > 0 && nextSequence !== taskIndex + 1 && nextSequence <= activeTasks.length) {
        setTaskIndex(nextSequence - 1);
        setLaunchReadyLoading(false);
        setReaction(null);
        setIsCardRevealed(false);
        goToStep('launch', 1);
      }

      if (
        nextSyncState.isCurrentTaskRevealed &&
        nextSequence === taskIndex + 1 &&
        step === 'launch'
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setLaunchReadyLoading(false);
        setReaction(null);
        setIsCardRevealed(false);
        goToStep('card', 1);
      }

      return nextSyncState;
    } catch (error) {
      setSyncError(error?.message || t('perfectDate.errors.syncFailed', {
        defaultValue: lang === 'he' ? 'לא הצלחנו לסנכרן את הדייט כרגע.' : 'We could not sync the date right now.',
      }));
      return null;
    } finally {
      if (!silent) {
        setSyncLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isServerDeck || !scheduledDateNumber || !participantAccessToken) {
      return undefined;
    }

    if (step !== 'launch' && step !== 'card') {
      return undefined;
    }

    const intervalId = setInterval(() => {
      void syncPerfectDateState(true);
    }, step === 'launch' ? 1000 : 2500);

    return () => clearInterval(intervalId);
  }, [isServerDeck, scheduledDateNumber, participantAccessToken, role, step, taskIndex, activeTasks.length, lang]);

  const handleCreatePerfectDate = async () => {
    setInviteError('');
    setInviteLoading(true);

    try {
      const result = await createPerfectDate({ userId });
      const nextInviteData = extractInviteData(result);

      // מי שיצר את הדייט הוא תמיד הצד הראשון בחדר.
      setRole(nextInviteData.participantRole || 'user1');
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

      // מי שמצטרף דרך קוד/קישור הוא הצד השני, בלי לשאול את המשתמש.
      const nextInviteData = extractInviteData(result);

      setRole(nextInviteData.participantRole || 'user2');
      setInviteData(nextInviteData);
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
    setQuestionError('');

    if (safeQuestionStepIndex === 0) {
      goToStep('lobby', -1);
      return;
    }

    goToQuestionStep(questionSteps[safeQuestionStepIndex - 1].id, -1);
  };

  const saveQuestionnaire = async () => {
    if (!gender) {
      goToQuestionStep('gender', -1);
      setQuestionError(t('perfectDate.errors.genderRequired'));
      return;
    }

    if (!hasAge || !isAgeValid) {
      goToQuestionStep('gender', -1);
      setQuestionError(t('perfectDate.errors.ageRequired'));
      return;
    }

    if (!scheduledDateNumber) {
      setQuestionError(t('perfectDate.errors.missingDateNumber'));
      return;
    }

    setSetupLoading(true);
    setQuestionError('');

    try {
      // המגדר חובה להתאמת הדייט; עדכון פרופיל המשתמש נעשה בשרת ברקע אם חסר שם מגדר.
      const result = await savePerfectDateSetup({
        dateNumber: scheduledDateNumber,
        accessToken: participantAccessToken,
        userId,
        participantRole: role,
        gender,
        age: ageNumber,
        location,
        vibe,
        goal,
        exactLocation,
        limitNoWorkAndMoney: boundaries.includes('no_work_money'),
        limitNoFutureTalk: boundaries.includes('no_future_talk'),
        limitNoHeavyPast: boundaries.includes('no_heavy_past'),
        limitNoPhysical: boundaries.includes('no_physical'),
      });

      setInviteData(extractInviteData(result));
      goToStep('saved', 1);
    } catch (error) {
      setQuestionError(getSetupErrorMessage(error));
    } finally {
      setSetupLoading(false);
    }
  };

  const goQuestionNext = async () => {
    setQuestionError('');

    if (questionStep === 'gender' && !gender) {
      setQuestionError(t('perfectDate.errors.genderRequired'));
      return;
    }

    if (questionStep === 'gender' && (!hasAge || !isAgeValid)) {
      setQuestionError(t('perfectDate.errors.ageRequired'));
      return;
    }

    if (safeQuestionStepIndex >= questionSteps.length - 1) {
      await saveQuestionnaire();
      return;
    }

    goToQuestionStep(questionSteps[safeQuestionStepIndex + 1].id, 1);
  };

  const settleSwipe = () => {
    Animated.spring(questionSwipeX, {
      toValue: 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const flingCard = (direction, onComplete) => {
    Animated.timing(questionSwipeX, {
      toValue: direction * 520,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      questionSwipeX.setValue(0);
      onComplete?.();
    });
  };

  const questionPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          questionSwipeX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          if (setupLoading) {
            settleSwipe();
            return;
          }

          if (gesture.dx < -92) {
            if (!hasCurrentSelection) {
              setQuestionError(
                questionStep === 'gender' && gender
                  ? t('perfectDate.errors.ageRequired')
                  : t('perfectDate.errors.genderRequired'),
              );
              settleSwipe();
              return;
            }

            Haptics.selectionAsync().catch(() => {});
            flingCard(-1, () => {
              void goQuestionNext();
            });
            return;
          }

          if (gesture.dx > 92) {
            Haptics.selectionAsync().catch(() => {});
            flingCard(1, goQuestionBack);
            return;
          }

          settleSwipe();
        },
        onPanResponderTerminate: settleSwipe,
      }),
    [gender, goQuestionBack, goQuestionNext, hasCurrentSelection, questionStep, questionSwipeX, setupLoading, t],
  );

  const handleRevealReady = async () => {
    if (!isServerDeck) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setReaction(null);
      setIsCardRevealed(false);
      goToStep('card', 1);
      return;
    }

    if (!currentTask?.perfectDateTaskId) {
      setSyncError(t('perfectDate.errors.syncFailed', {
        defaultValue: lang === 'he' ? 'לא הצלחנו לסנכרן את הדייט כרגע.' : 'We could not sync the date right now.',
      }));
      return;
    }

    setLaunchReadyLoading(true);
    setSyncError('');

    try {
      const result = await markPerfectDateTaskRevealReady({
        dateNumber: scheduledDateNumber,
        accessToken: participantAccessToken,
        userId,
        participantRole: role,
        perfectDateTaskId: currentTask.perfectDateTaskId,
        languageCode: lang,
      });
      const nextSyncState = extractSyncState(result);

      setSyncState(nextSyncState);

      if (nextSyncState.isCurrentTaskRevealed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setLaunchReadyLoading(false);
        setReaction(null);
        setIsCardRevealed(false);
        goToStep('card', 1);
      }
    } catch (error) {
      setLaunchReadyLoading(false);
      setSyncError(error?.message || t('perfectDate.errors.syncFailed', {
        defaultValue: lang === 'he' ? 'לא הצלחנו לסנכרן את הדייט כרגע.' : 'We could not sync the date right now.',
      }));
    }
  };

  const startHold = () => {
    if (launchReadyLoading || isWaitingToReveal) {
      return;
    }

    holdProgress.setValue(0);
    Haptics.selectionAsync().catch(() => {});

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      void handleRevealReady();
    });
  };

  const cancelHold = () => {
    if (launchReadyLoading || isWaitingToReveal) {
      return;
    }

    holdProgress.stopAnimation();
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleDone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (isServerDeck) {
      if (!currentTask?.perfectDateTaskId) {
        setSyncError(t('perfectDate.errors.syncFailed', {
          defaultValue: lang === 'he' ? 'לא הצלחנו לסנכרן את הדייט כרגע.' : 'We could not sync the date right now.',
        }));
        return;
      }

      setSyncLoading(true);
      setSyncError('');

      try {
        const result = await markPerfectDateTaskReady({
          dateNumber: scheduledDateNumber,
          accessToken: participantAccessToken,
          userId,
          participantRole: role,
          perfectDateTaskId: currentTask.perfectDateTaskId,
          languageCode: lang,
        });
        const nextSyncState = extractSyncState(result);
        const nextSequence = Number(nextSyncState.currentSequenceNumber || 1);

        setSyncState(nextSyncState);

        if (nextSyncState.isCompleted) {
          goToStep('done', 1);
          return;
        }

        if (nextSequence > taskIndex + 1 && nextSequence <= activeTasks.length) {
          setTaskIndex(nextSequence - 1);
          setLaunchReadyLoading(false);
          setReaction(null);
          setIsCardRevealed(false);
          goToStep('launch', 1);
        }
      } catch (error) {
        setSyncError(error?.message || t('perfectDate.errors.syncFailed', {
          defaultValue: lang === 'he' ? 'לא הצלחנו לסנכרן את הדייט כרגע.' : 'We could not sync the date right now.',
        }));
      } finally {
        setSyncLoading(false);
      }

      return;
    }

    if (taskIndex >= activeTasks.length - 1) {
      goToStep('done', 1);
      return;
    }
    setTaskIndex((prev) => prev + 1);
    setLaunchReadyLoading(false);
    setReaction(null);
    setIsCardRevealed(false);
    goToStep('launch', 1);
  };

  const shareTask = async () => {
    if (!displayText) return;

    let sharedImage = false;
    try {
      sharedImage = await perfectDateShareRef.current?.share?.();
    } catch (error) {
      sharedImage = false;
    }

    if (sharedImage) return;

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
        <MaterialCommunityIcons name="chevron-right" size={26} color="#5B1B2E" />
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
          <ToggleChip icon="home-heart" label={t('perfectDate.location.home')} active={location === 'home'} onPress={() => setLocation('home')} />
          <ToggleChip icon="silverware-fork-knife" label={t('perfectDate.location.out')} active={location === 'out'} onPress={() => setLocation('out')} />
          <View style={styles.exactLocationBox}>
            <Text style={styles.exactLocationLabel}>{t('perfectDate.location.exactLabel')}</Text>
            <TextInput
              value={exactLocation}
              onChangeText={(value) => setExactLocation(value.slice(0, 30))}
              maxLength={30}
              placeholder={t('perfectDate.location.exactPlaceholder')}
              placeholderTextColor="#B45309"
              style={styles.exactLocationInput}
              textAlign="center"
            />
            <Text style={styles.exactLocationCounter}>{`${exactLocation.length}/30`}</Text>
          </View>
        </View>
      );
    }

    if (questionStep === 'gender') {
      return (
        <View style={styles.choiceStack}>
          {genderOptions.map((item) => (
            <ToggleChip
              key={item.id}
              icon={item.icon}
              label={item.title}
              active={gender === item.id}
              onPress={() => {
                setGender(item.id);
                setQuestionError('');
              }}
            />
          ))}
          <View style={styles.ageBox}>
            <Text style={styles.ageLabel}>{t('perfectDate.gender.ageLabel')}</Text>
            <TextInput
              value={age}
              onChangeText={(value) => {
                const nextAge = value.replace(/\D/g, '').slice(0, 3);
                setAge(nextAge);
                if (!nextAge || (Number(nextAge) >= 18 && Number(nextAge) <= 120)) {
                  setQuestionError('');
                }
              }}
              maxLength={3}
              keyboardType="number-pad"
              placeholder={t('perfectDate.gender.agePlaceholder')}
              placeholderTextColor="#B45309"
              style={styles.ageInput}
              textAlign="center"
            />
          </View>
        </View>
      );
    }

    if (questionStep === 'vibe') {
      return (
        <View style={styles.choiceStack}>
          {vibes.map((item) => (
            <ToggleChip key={item.id} icon={item.icon} label={item.title} active={vibe === item.id} onPress={() => setVibe(item.id)} />
          ))}
        </View>
      );
    }

    if (questionStep === 'goal') {
      return (
        <View style={styles.choiceStack}>
          {goals.map((item) => (
            <ToggleChip key={item.id} icon={item.icon} label={item.title} active={goal === item.id} onPress={() => setGoal(item.id)} />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.choiceStack}>
        {boundaryOptions.map((item) => (
          <ToggleChip
            key={item.id}
            icon={item.icon}
            label={item.title}
            active={boundaries.includes(item.id)}
            onPress={() => toggleBoundary(item.id)}
          />
        ))}
      </View>
    );
  };

  const screenSlideStyle = {
    opacity: screenMotion,
    transform: [
      {
        translateX: screenMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [screenTransitionDirection.current * SCREEN_SLIDE_DISTANCE, 0],
        }),
      },
    ],
  };
  const questionSlideX = Animated.add(
    questionSwipeX,
    questionMotion.interpolate({
      inputRange: [0, 1],
      outputRange: [questionTransitionDirection.current * SCREEN_SLIDE_DISTANCE, 0],
    }),
  );

  return (
    <LinearGradient colors={['#FFF7FA', '#FCE7F3', '#FFFFFF']} style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {step === 'lobby' && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSafePadding }]}>
            {renderHeader(t('perfectDate.lobby.header'))}

            <View style={styles.lobbyHero}>
              <View style={styles.lobbyIconWrap}>
                <MaterialCommunityIcons name="calendar-heart" size={34} color="#FFFFFF" />
              </View>
              <Text style={styles.lobbyTitle}>{t('perfectDate.lobby.heroTitle')}</Text>
              <Text style={styles.lobbyText}>{t('perfectDate.lobby.heroText')}</Text>
            </View>

            <View style={[styles.hidden, styles.inputBox]}>
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
              <View style={styles.lobbyReadyCard}>
                <Text style={styles.inviteLabel}>{t('perfectDate.invite.codeLabel', { defaultValue: 'Your date code' })}</Text>
                <Text style={styles.inviteCode}>{inviteData.dateNumber}</Text>
                <Text style={styles.inviteText}>{t('perfectDate.invite.text', { defaultValue: 'Share the invite, then continue to a short setup.' })}</Text>
                <View style={styles.lobbyActionRow}>
                  <TouchableOpacity style={styles.lobbySoftButton} onPress={sharePerfectDateInvite}>
                    <MaterialCommunityIcons name="share-variant" size={18} color="#7A2E43" />
                    <Text style={styles.lobbySoftButtonText}>{t('perfectDate.invite.shareButton', { defaultValue: 'Share' })}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.lobbyMainButton} onPress={enterQuestions}>
                    <Text style={styles.lobbyMainButtonText}>{t('perfectDate.invite.continueButton', { defaultValue: 'Continue' })}</Text>
                    <MaterialCommunityIcons name="arrow-left" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.lobbyStartCard}>
                <TouchableOpacity
                  style={[styles.lobbyMainButton, inviteLoading && styles.buttonDisabled]}
                  onPress={handleCreatePerfectDate}
                  disabled={inviteLoading}
                >
                  <Text style={styles.lobbyMainButtonText}>
                    {inviteLoading
                      ? t('perfectDate.lobby.loading', { defaultValue: 'One moment...' })
                      : t('perfectDate.lobby.createButton')}
                  </Text>
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.joinCodeBox}>
                  <Text style={styles.inputLabel}>{t('perfectDate.lobby.codeLabel')}</Text>
                  <TextInput
                    value={dateNumber}
                    onChangeText={setDateNumber}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder={t('perfectDate.lobby.codePlaceholder')}
                    placeholderTextColor="#B58A98"
                    style={styles.textInput}
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={[styles.lobbySoftButton, styles.lobbyJoinButton, inviteLoading && styles.buttonDisabled]}
                    onPress={handleJoinPerfectDate}
                    disabled={inviteLoading}
                  >
                    <Text style={styles.lobbySoftButtonText}>{t('perfectDate.lobby.joinButton')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {inviteData?.dateNumber ? (
              <View style={[styles.hidden, styles.inviteCard]}>
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
              style={[styles.hidden, styles.primaryButton, inviteLoading && styles.buttonDisabled]}
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
              style={[styles.hidden, styles.secondaryButton, inviteLoading && styles.buttonDisabled]}
              onPress={handleJoinPerfectDate}
              disabled={inviteLoading}
            >
              <Text style={styles.secondaryButtonText}>{t('perfectDate.lobby.joinButton')}</Text>
            </TouchableOpacity>
            {inviteData?.dateNumber ? (
              <TouchableOpacity style={[styles.hidden, styles.primaryButton]} onPress={enterQuestions}>
                <Text style={styles.primaryButtonText}>{t('perfectDate.invite.continueButton', { defaultValue: 'המשך לשאלון' })}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
          </Animated.View>
        )}

        {step === 'questions' && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <View style={[styles.questionScreen, { paddingBottom: bottomSafePadding }]}>
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

            <Animated.View
              {...questionPanResponder.panHandlers}
              style={[
                styles.questionCard,
                {
                  opacity: questionMotion,
                  transform: [
                    { translateX: questionSlideX },
                    {
                      translateY: questionMotion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                    {
                      rotate: questionSwipeX.interpolate({
                        inputRange: [-220, 0, 220],
                        outputRange: ['-4deg', '0deg', '4deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScrollView
                style={styles.questionContent}
                contentContainerStyle={styles.questionContentInner}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.questionTitle}>{currentQuestionStep.title}</Text>
                <Text style={styles.questionSubtitle}>{currentQuestionStep.subtitle}</Text>
                {renderQuestionChoices()}
              </ScrollView>

              <View style={styles.swipeGuide}>
                <View style={styles.selectedSummary}>
                  <MaterialCommunityIcons
                    name={hasCurrentSelection ? 'check-circle' : 'gesture-swipe-horizontal'}
                    size={20}
                    color={hasCurrentSelection ? '#BE185D' : '#9F3954'}
                  />
                  <Text style={styles.selectedSummaryText}>
                    {hasCurrentSelection
                      ? t('perfectDate.questions.selectedValue', {
                        value: currentSelectionLabel,
                      })
                      : t('perfectDate.questions.selectToContinue')}
                  </Text>
                </View>
                <View style={styles.swipeHintRow}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    disabled={!hasCurrentSelection || setupLoading}
                    onPress={goQuestionNext}
                    style={[
                      styles.swipeArrowAction,
                      styles.swipeArrowNext,
                      (!hasCurrentSelection || setupLoading) && styles.swipeArrowDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
                    <Text style={styles.swipeArrowText}>
                      {safeQuestionStepIndex === questionSteps.length - 1
                        ? t('perfectDate.questions.swipeSaveShort')
                        : t('perfectDate.questions.swipeNextShort')}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.swipeCenterHint}>
                    <MaterialCommunityIcons name="gesture-swipe-horizontal" size={18} color="#9F3954" />
                    <Text style={styles.swipeCenterText}>{t('perfectDate.questions.swipeHint')}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.86}
                    disabled={setupLoading}
                    onPress={goQuestionBack}
                    style={styles.swipeArrowAction}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={28} color="#BE185D" />
                    <Text style={[styles.swipeArrowText, styles.swipeArrowTextDark]}>
                      {t('perfectDate.questions.swipeBackShort')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {questionError ? (
              <Text style={styles.errorText}>{questionError}</Text>
            ) : null}
          </View>
          </Animated.View>
        )}

        {step === 'saved' && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <View style={[styles.centerContent, { paddingBottom: bottomSafePadding }]}>
            {renderHeader(t('perfectDate.saved.header'))}
            <View style={styles.savedCard}>
              <Text style={styles.savedNumber}>{scheduledDateNumber}</Text>
              <Text style={styles.savedTitle}>{t('perfectDate.saved.title')}</Text>
              <Text style={styles.savedText}>
                {t('perfectDate.saved.text')}
              </Text>
            </View>
            {deckError ? (
              <Text style={styles.errorText}>{deckError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, deckLoading && styles.buttonDisabled]}
              disabled={deckLoading}
              onPress={async () => {
                const loaded = await loadPerfectDateDeck();
                if (loaded) {
                  goToStep('launch', 1);
                }
              }}
            >
              <Text style={styles.primaryButtonText}>
                {deckLoading ? t('perfectDate.actions.loadingDeck') : t('perfectDate.saved.launchButton')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => goToStep('questions', -1)}>
              <Text style={styles.secondaryButtonText}>{t('perfectDate.saved.editButton')}</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        )}

        {step === 'launch' && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <View style={[styles.launchContent, { paddingBottom: bottomSafePadding }]}>
            {renderHeader(t('perfectDate.launch.header', { progress: progressText }))}
            <Text style={styles.launchTitle}>{t('perfectDate.launch.title')}</Text>
            <Text style={styles.launchText}>
              {t('perfectDate.launch.text')}
            </Text>
            {isWaitingToReveal ? (
              <View style={styles.syncNotice}>
                <MaterialCommunityIcons name="heart-sync-outline" size={20} color="#7A2E43" />
                <Text style={styles.syncNoticeText}>
                  {t('perfectDate.launch.waitingPartner', {
                    defaultValue: lang === 'he' ? 'הצד שלך מוכן. מחכים לצד השני...' : 'Your side is ready. Waiting for your partner...',
                  })}
                </Text>
              </View>
            ) : isPartnerWaitingToReveal ? (
              <View style={styles.syncNotice}>
                <MaterialCommunityIcons name="account-clock-outline" size={20} color="#7A2E43" />
                <Text style={styles.syncNoticeText}>
                  {t('perfectDate.launch.partnerReady', {
                    defaultValue: lang === 'he' ? 'הצד השני כבר מוכן. החזיקו כדי לפתוח יחד.' : 'Your partner is ready. Hold to open together.',
                  })}
                </Text>
              </View>
            ) : null}
            {syncError ? (
              <Text style={styles.errorText}>{syncError}</Text>
            ) : null}

            <Pressable
              onPressIn={startHold}
              onPressOut={cancelHold}
              disabled={launchReadyLoading || isWaitingToReveal}
              style={[styles.holdButtonOuter, (launchReadyLoading || isWaitingToReveal) && styles.holdButtonWaiting]}
            >
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
                <MaterialCommunityIcons
                  name={isWaitingToReveal || launchReadyLoading ? 'heart-sync' : 'cards-heart'}
                  size={42}
                  color="#FFFFFF"
                />
                <Text style={styles.holdButtonText}>
                  {launchReadyLoading
                    ? t('perfectDate.actions.syncing', { defaultValue: lang === 'he' ? 'מסנכרן...' : 'Syncing...' })
                    : isWaitingToReveal
                      ? t('perfectDate.actions.waitingPartner', { defaultValue: lang === 'he' ? 'ממתין לשותף' : 'Waiting for partner' })
                      : t('perfectDate.launch.holdButton')}
                </Text>
              </View>
            </Pressable>
          </View>
          </Animated.View>
        )}

        {step === 'card' && currentTask && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <View style={[styles.cardContent, { paddingBottom: bottomSafePadding }]}>
            {renderHeader(t('perfectDate.card.header', { progress: progressText }))}
            <View style={[styles.dateCard, !isCardRevealed && styles.cardBack, isCardRevealed && isSecret && styles.secretCard]}>
              {!isCardRevealed ? (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => setIsCardRevealed(true)}
                  style={styles.cardBackContent}
                >
                  <View style={styles.cardBackIconWrap}>
                    <MaterialCommunityIcons name="cards-heart" size={42} color="#BE185D" />
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
                  <ActionButton
                    label={
                      syncLoading
                        ? t('perfectDate.actions.syncing', {
                          defaultValue: lang === 'he' ? 'מסנכרן...' : 'Syncing...',
                        })
                        : isWaitingForPartner
                          ? t('perfectDate.actions.waitingPartner', {
                            defaultValue: lang === 'he' ? 'ממתין לשותף' : 'Waiting for partner',
                          })
                          : t('perfectDate.actions.done')
                    }
                    icon={isWaitingForPartner ? 'account-clock-outline' : 'check-bold'}
                    filled
                    disabled={syncLoading || isWaitingForPartner}
                    onPress={handleDone}
                  />
                  <ActionButton label={t('perfectDate.actions.share')} icon="share-variant" onPress={shareTask} />
                </View>
                {isWaitingForPartner ? (
                  <View style={styles.syncNotice}>
                    <MaterialCommunityIcons name="heart-sync-outline" size={20} color="#7A2E43" />
                    <Text style={styles.syncNoticeText}>
                      {t('perfectDate.sync.waitingText', {
                        defaultValue: lang === 'he'
                          ? 'סימנת שסיימת. נעבור לכרטיס הבא רק כשהשותף יסמן גם.'
                          : 'You marked this card as done. The next card opens only after your partner marks done too.',
                      })}
                    </Text>
                  </View>
                ) : null}
                {isPartnerWaiting ? (
                  <View style={styles.syncNotice}>
                    <MaterialCommunityIcons name="account-clock-outline" size={20} color="#7A2E43" />
                    <Text style={styles.syncNoticeText}>
                      {t('perfectDate.sync.partnerWaiting', {
                        defaultValue: lang === 'he' ? 'השותף כבר ממתין לך בכרטיס הזה.' : 'Your partner is waiting for you on this card.',
                      })}
                    </Text>
                  </View>
                ) : null}
                {syncError ? (
                  <Text style={styles.errorText}>{syncError}</Text>
                ) : null}
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
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View style={[styles.stepFrame, screenSlideStyle]}>
          <View style={[styles.centerContent, { paddingBottom: bottomSafePadding }]}>
            {renderHeader(t('perfectDate.done.header'))}
            <View style={styles.savedCard}>
              <MaterialCommunityIcons name="heart-check" size={56} color="#BE185D" />
              <Text style={styles.savedTitle}>{t('perfectDate.done.title')}</Text>
              <Text style={styles.savedText}>
                {t('perfectDate.done.text')}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('GameModeSelect', { userId, user })}>
              <Text style={styles.primaryButtonText}>{t('perfectDate.done.backHome')}</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        )}
      </SafeAreaView>
      <PerfectDateShareCard
        ref={perfectDateShareRef}
        dateNumber={scheduledDateNumber}
        label={isSecret ? t('perfectDate.card.secretPill') : displayLabel || t('perfectDate.card.sharedMoment')}
        text={displayText}
        progressText={progressText}
        isSecret={Boolean(isSecret)}
        lang={lang}
        t={t}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  stepFrame: { flex: 1 },
  hidden: { display: 'none' },
  scrollContent: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 34,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  questionScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  centerContent: { flex: 1, padding: 18, justifyContent: 'center' },
  launchContent: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  header: {
    width: '100%',
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    paddingHorizontal: 54,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
  },
  headerTextWrap: { width: '100%', alignItems: 'center' },
  title: { fontSize: 27, fontWeight: '900', color: '#5B1B2E', textAlign: 'center' },
  subtitle: { marginTop: 4, fontSize: 14, fontWeight: '700', color: '#8A3048', textAlign: 'center', lineHeight: 20 },
  lobbyHero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  lobbyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BE185D',
    marginBottom: 16,
    shadowColor: '#9F1239',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  lobbyTitle: {
    color: '#5B1B2E',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 9,
  },
  lobbyText: {
    color: '#7A2E43',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 330,
  },
  lobbyStartCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.1)',
    gap: 14,
  },
  lobbyReadyCard: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
    alignItems: 'center',
  },
  joinCodeBox: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: 'rgba(255,247,250,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.08)',
  },
  lobbyActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  lobbyMainButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#BE185D',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#9F1239',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lobbyMainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  lobbySoftButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  lobbyJoinButton: {
    marginTop: 12,
  },
  lobbySoftButtonText: {
    color: '#5B1B2E',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroBox: {
    minHeight: 176,
    borderRadius: 24,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
    marginBottom: 18,
  },
  heroTitle: { marginTop: 12, fontSize: 23, fontWeight: '900', color: '#9F1239', textAlign: 'center', lineHeight: 30 },
  heroText: { marginTop: 10, fontSize: 15, lineHeight: 23, color: '#5B1B2E', textAlign: 'center', fontWeight: '600' },
  inputBox: { marginBottom: 14 },
  inputLabel: { fontSize: 14, color: '#5B1B2E', fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  textInput: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
    fontSize: 22,
    fontWeight: '900',
    color: '#5B1B2E',
    paddingHorizontal: 16,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: '#BE185D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#9F1239',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
  },
  secondaryButtonText: { color: '#5B1B2E', fontSize: 16, fontWeight: '900', textAlign: 'center' },
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
    borderColor: 'rgba(190,24,93,0.16)',
    marginBottom: 4,
    alignItems: 'center',
  },
  inviteLabel: {
    color: '#5B1B2E',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  inviteCode: {
    color: '#BE185D',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 5,
    marginTop: 4,
  },
  inviteText: {
    color: '#7A2E43',
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
    color: '#5B1B2E',
    fontSize: 13,
    fontWeight: '900',
  },
  progressPercent: {
    color: '#BE185D',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#BE185D',
  },
  questionCard: {
    flex: 1,
    borderRadius: 26,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.1)',
    justifyContent: 'space-between',
    shadowColor: '#9F1239',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  questionContent: {
    flex: 1,
    marginBottom: 16,
  },
  questionContentInner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 18,
  },
  questionTitle: {
    color: '#5B1B2E',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 7,
  },
  questionSubtitle: {
    color: '#7A2E43',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  choiceStack: {
    width: '100%',
    gap: 12,
    paddingBottom: 6,
  },
  exactLocationBox: {
    borderRadius: 22,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  exactLocationLabel: {
    color: '#5B1B2E',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  exactLocationInput: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: '#FFF7FA',
    color: '#5B1B2E',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
    textAlign: 'center',
  },
  exactLocationCounter: {
    color: '#9F3954',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'left',
    marginTop: 5,
  },
  ageBox: {
    borderRadius: 22,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  ageLabel: {
    color: '#5B1B2E',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  ageInput: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: '#FFF7FA',
    color: '#5B1B2E',
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
    textAlign: 'center',
  },
  swipeGuide: {
    flexShrink: 0,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.08)',
  },
  selectedSummary: {
    minHeight: 32,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 8,
  },
  selectedSummaryText: {
    flexShrink: 1,
    color: '#5B1B2E',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  swipeArrowAction: {
    width: 62,
    minHeight: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
    shadowColor: '#9F1239',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  swipeArrowNext: {
    backgroundColor: '#BE185D',
    borderColor: '#BE185D',
  },
  swipeArrowDisabled: {
    opacity: 0.46,
  },
  swipeArrowText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: -2,
  },
  swipeArrowTextDark: {
    color: '#BE185D',
  },
  swipeCenterHint: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,247,250,0.85)',
  },
  swipeCenterText: {
    color: '#9F3954',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.1)',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#5B1B2E', textAlign: 'center', marginBottom: 10 },
  row: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  choiceCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#9F1239',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  choiceCardActive: {
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  choiceGradient: {
    minHeight: 70,
    borderRadius: 22,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.08)',
  },
  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7FA',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  choiceIconWrapActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.86)',
  },
  choiceText: {
    flex: 1,
    color: '#5B1B2E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  choiceCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7FA',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.12)',
  },
  choiceCheckActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.86)',
  },
  savedCard: {
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
    marginBottom: 18,
  },
  savedNumber: { fontSize: 48, letterSpacing: 5, fontWeight: '900', color: '#BE185D' },
  savedTitle: { marginTop: 12, fontSize: 23, fontWeight: '900', color: '#5B1B2E', textAlign: 'center' },
  savedText: { marginTop: 10, fontSize: 15, lineHeight: 24, fontWeight: '600', color: '#7A2E43', textAlign: 'center' },
  launchTitle: { fontSize: 32, fontWeight: '900', color: '#5B1B2E', textAlign: 'center', marginTop: 18 },
  launchText: {
    marginTop: 10,
    marginBottom: 34,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
    color: '#7A2E43',
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
  holdButtonWaiting: {
    opacity: 0.88,
  },
  holdProgress: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: '#BE185D',
  },
  holdButtonInner: {
    width: 154,
    height: 154,
    borderRadius: 77,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BE185D',
  },
  holdButtonText: { color: '#FFFFFF', marginTop: 8, fontSize: 18, fontWeight: '900' },
  dateCard: {
    flex: 1,
    maxHeight: 520,
    borderRadius: 32,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.14)',
    shadowColor: '#9F1239',
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
    color: '#7A2E43',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardBackTitle: {
    color: '#5B1B2E',
    fontSize: 34,
    lineHeight: 43,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardBackHint: {
    marginTop: 18,
    color: '#BE185D',
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
    color: '#9F1239',
    fontSize: 13,
    fontWeight: '900',
  },
  cardCounter: { fontSize: 13, fontWeight: '900', color: '#7A2E43' },
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
    backgroundColor: '#BE185D',
    shadowColor: '#9F1239',
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
  syncNotice: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.16)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncNoticeText: {
    color: '#7A2E43',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
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
    borderColor: 'rgba(190,24,93,0.14)',
  },
  actionButtonFilled: { backgroundColor: '#BE185D', borderColor: '#BE185D' },
  actionButtonDisabled: { opacity: 0.68 },
  actionButtonText: { color: '#5B1B2E', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  actionButtonTextFilled: { color: '#FFFFFF' },
});
