import { supabase } from '../lib/supabase';

export const teacherService = {
  /**
   * Fetch active teachers filtered by gender (Anti-Ikhtilat)
   */
  async fetchActiveTeachers(gender) {
    const { data, error } = await supabase
      .from('teacher_schedules')
      .select('*')
      .not('meeting_link', 'is', null)
      .eq('teacher_gender', gender);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Join a specific class (student side)
   */
  async joinClass(studentData) {
    const { error } = await supabase.from('active_class_participants').insert({
      schedule_id: studentData.scheduleId,
      student_id: studentData.studentId,
      student_name: studentData.studentName,
      student_gender: studentData.studentGender,
      target_surah_id: studentData.targetSurahId,
      target_ayah: studentData.targetAyah
    });
    if (error) throw error;
  },

  /**
   * Fetch schedules for a specific teacher
   */
  async fetchTeacherSchedules(teacherId) {
    const { data, error } = await supabase
      .from('teacher_schedules')
      .select('*')
      .eq('teacher_id', teacherId);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Add new teaching schedule
   */
  async addSchedule(scheduleData) {
    const { error } = await supabase.from('teacher_schedules').insert(scheduleData);
    if (error) throw error;
  },

  /**
   * Delete schedule
   */
  async deleteSchedule(id) {
    const { error } = await supabase.from('teacher_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Update meeting link (teacher side)
   */
  async updateScheduleLink(scheduleId, link) {
    const { data, error } = await supabase
      .from('teacher_schedules')
      .update({ meeting_link: link })
      .eq('id', scheduleId)
      .select();
    
    if (error) throw error;
    return data;
  },

  /**
   * Finish meeting: reset link and student count
   */
  async finishMeeting(scheduleId) {
    const { error } = await supabase
      .from('teacher_schedules')
      .update({ meeting_link: null, current_students_count: 0 })
      .eq('id', scheduleId);
    
    if (error) throw error;

    // Also clear participants
    await this.clearParticipants(scheduleId);
  },

  /**
   * Clear all participants for a schedule
   */
  async clearParticipants(scheduleId) {
    const { error } = await supabase
      .from('active_class_participants')
      .delete()
      .eq('schedule_id', scheduleId);
    
    if (error) throw error;
  }
};
