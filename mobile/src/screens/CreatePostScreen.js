import { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../components/Screen.js';
import { Header } from '../components/Header.js';
import { Avatar } from '../components/Avatar.js';
import { GradientButton } from '../components/GradientButton.js';
import { postApi } from '../api/endpoints.js';
import { useFeedStore } from '../store/feedStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';

const MAX_LENGTH = 1000;
// Matches the API's createPostSchema.
const MAX_IMAGES = 4;

/**
 * Placeholder composer. Photos are picked and previewed locally, but there is
 * no upload endpoint yet, so only the text is sent to the API.
 */
export default function CreatePostScreen({ navigation }) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const prepend = useFeedStore((s) => s.prepend);

  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
  };

  const removeImage = (uri) => setImages((prev) => prev.filter((u) => u !== uri));

  const submit = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setError(null);
    setPosting(true);
    try {
      const res = await postApi.create({ text: body });
      prepend(res.post);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const onBack = () => {
    if (!text.trim() && images.length === 0) return navigation.goBack();
    return Alert.alert(t('createPost.discardTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('createPost.discard'), style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen edges={['bottom']}>
      <Header title={t('createPost.title')} onBack={onBack} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.authorRow}>
            <Avatar name={user?.name} uri={user?.avatarUrl} size={40} />
            <Text style={styles.author} numberOfLines={1}>{user?.name || '—'}</Text>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('feed.newPost')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            style={[styles.input, focused && styles.inputFocused]}
          />
          <Text style={styles.counter}>{text.length}/{MAX_LENGTH}</Text>

          {images.length > 0 ? (
            <View style={styles.grid}>
              {images.map((uri) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable
                    onPress={() => removeImage(uri)}
                    style={styles.remove}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('createPost.removePhoto')}
                  >
                    <Ionicons name="close" size={14} color={colors.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={pickImages}
            disabled={images.length >= MAX_IMAGES}
            style={({ pressed }) => [
              styles.addPhoto,
              images.length >= MAX_IMAGES && styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="image-outline" size={20} color={colors.gold} />
            <Text style={styles.addPhotoText}>
              {t('createPost.addPhotos', { count: images.length, max: MAX_IMAGES })}
            </Text>
          </Pressable>
          {images.length > 0 ? <Text style={styles.note}>{t('createPost.photosNotUploaded')}</Text> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradientButton
            title={t('feed.post')}
            onPress={submit}
            loading={posting}
            disabled={!text.trim()}
            style={styles.cta}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const THUMB = 76;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  author: { ...type.author, flex: 1 },

  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    ...type.input,
    lineHeight: 23,
  },
  inputFocused: { borderColor: colors.gold },
  counter: { ...type.tiny, alignSelf: 'flex-end', marginTop: -spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: { width: THUMB, height: THUMB },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, backgroundColor: colors.cardLift },
  remove: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },

  addPhoto: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: colors.goldSoft,
  },
  addPhotoText: { ...type.pill },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  note: { ...type.caption },
  error: { ...type.caption, color: colors.danger },
  cta: { marginTop: spacing.sm },
});
