import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Pipeline endpoints
export const usePipelineStatus = () => {
  return useQuery({
    queryKey: ['pipeline', 'status'],
    queryFn: async () => {
      const response = await apiClient.get('/pipeline/status');
      return response.data;
    },
    // The main.tsx has a default refetchInterval of 1500
  });
};

export const usePipelineLogs = (pipelineId?: string) => {
  return useQuery({
    queryKey: ['pipeline', 'logs', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return { logs: [] };
      const response = await apiClient.get(`/pipeline/${pipelineId}/logs`);
      return response.data;
    },
    enabled: !!pipelineId,
    refetchInterval: 1500,
  });
};

export const useTriggerPipeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pdf_url?: string; file?: File }) => {
      const formData = new FormData();
      if (data.file) {
        formData.append('file', data.file);
      } else if (data.pdf_url) {
        formData.append('pdf_url', data.pdf_url);
      }
      const response = await apiClient.post('/guidelines/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', 'status'] });
    }
  });
};

// Patient endpoints
export const usePatients = (siteId?: string, isFlagged?: boolean) => {
  return useQuery({
    queryKey: ['patients', { siteId, isFlagged }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (siteId) params.append('site_id', siteId);
      if (isFlagged !== undefined) params.append('is_flagged', isFlagged.toString());
      
      const response = await apiClient.get(`/patients?${params.toString()}`);
      return response.data;
    }
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const usePatientReadings = (id: string) => {
  return useQuery({
    queryKey: ['patients', id, 'readings'],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${id}/readings`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Rules & Guidelines
export const useRulesHistory = () => {
  return useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await apiClient.get('/rules');
      return response.data;
    }
  });
};

export const usePendingRules = () => {
  return useQuery({
    queryKey: ['rules', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get('/rules?status=PENDING');
      return response.data;
    }
  });
};

export const useApproveRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/rules/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    }
  });
};

export const useRejectRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/rules/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    }
  });
};

// Reports
export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await apiClient.get('/reports');
      return response.data;
    }
  });
};
