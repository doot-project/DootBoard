import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;
// @note embedded dashboard fallback to prevent ENOENT 500 error on Vercel/serverless
const EMBEDDED_DASHBOARD_HTML_BASE64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLDAsMCwwLjApOyB3aWR0aDoxMDAlOyBoZWlnaHQ6IDEwMCU7Ij4KCjxoZWFkPgogIDxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KICA8bWV0YSBodHRwLWVxdWl2PSJYLVVBLUNvbXBhdGlibGUiIGNvbnRlbnQ9IklFPWVkZ2UiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+R3Jvd3RvcGlhIFBsYXllciBTdXBwb3J0PC90aXRsZT4KICA8bGluayByZWw9Imljb24iIHR5cGU9ImltYWdlL3BuZyIKICAgIGhyZWY9Imh0dHBzOi8vczMuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb20vY2RuLmdyb3d0b3BpYWdhbWUuY29tL3dlYnNpdGUvcmVzb3VyY2VzL2Fzc2V0cy9pbWFnZXMvZ3Jvd3RvcGlhLmljbyIKICAgIHNpemVzPSIxNngxNiIgLz4KICA8bGluayByZWw9InNob3J0Y3V0IGljb24iCiAgICBocmVmPSJodHRwczovL3MzLmV1LXdlc3QtMS5hbWF6b25hd3MuY29tL2Nkbi5ncm93dG9waWFnYW1lLmNvbS93ZWJzaXRlL3Jlc291cmNlcy9hc3NldHMvaW1hZ2VzL2dyb3d0b3BpYS5pY28iCiAgICB0eXBlPSJpbWFnZS94LWljb24iPgogIDxsaW5rIHJlbD0iaWNvbiIKICAgIGhyZWY9Imh0dHBzOi8vczMuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb20vY2RuLmdyb3d0b3BpYWdhbWUuY29tL3dlYnNpdGUvcmVzb3VyY2VzL2Fzc2V0cy9pbWFnZXMvZ3Jvd3RvcGlhLmljbyIKICAgIHR5cGU9ImltYWdlL3gtaWNvbiI+CiAgPCEtLSBpbmNsdWRlIGJvb3RzdHJhcCBhbmQgY3VzdG9tICBjc3MgLS0+CiAgPGxpbmsgbWVkaWE9ImFsbCIgcmVsPSJzdHlsZXNoZWV0IgogICAgaHJlZj0iaHR0cHM6Ly9zMy5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbS9jZG4uZ3Jvd3RvcGlhZ2FtZS5jb20vd2Vic2l0ZS9yZXNvdXJjZXMvYXNzZXRzL2Nzcy9mYXEtbWFpbi5jc3MiPgogIDwhLS0gaW5jbHVkZSBjdXN0b20gIGNzcyAtLT4KICA8bGluayBtZWRpYT0iYWxsIiByZWw9InN0eWxlc2hlZXQiCiAgICBocmVmPSJodHRwczovL3MzLmV1LXdlc3QtMS5hbWF6b25hd3MuY29tL2Nkbi5ncm93dG9waWFnYW1lLmNvbS93ZWJzaXRlL3Jlc291cmNlcy9hc3NldHMvY3NzL3Nob3AtY3VzdG9tLmNzcyI+CiAgPGxpbmsgbWVkaWE9ImFsbCIgcmVsPSJzdHlsZXNoZWV0IgogICAgaHJlZj0iaHR0cHM6Ly9zMy5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbS9jZG4uZ3Jvd3RvcGlhZ2FtZS5jb20vd2Vic2l0ZS9yZXNvdXJjZXMvYXNzZXRzL2Nzcy9pbmdhbWUtY3VzdG9tLmNzcyI+CiAgPHN0eWxlPgogICAgLm1vZGFsLWJhY2tkcm9wIHsKICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjEpICFpbXBvcnRhbnQ7CiAgICB9CgogICAgLm1vZGFsLWJhY2tkcm9wK2RpdiB7CiAgICAgIG92ZXJmbG93OiBhdXRvOwogICAgfQoKICAgIC5tb2RhbC1ib2R5LAogICAgLmNvbnRlbnQgewogICAgICBwYWRkaW5nOiAwOwogICAgfQogIDwvc3R5bGU+CjwvaGVhZD4KCjxib2R5IHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsMCwwLDAuMCk7Ij4KICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBidG4tcHJpbWFyeSBoaWRkZW4iIGRhdGEtdG9nZ2xlPSJtb2RhbCIgaWQ9Im1vZGFsQnV0dG9uIiBkYXRhLXRhcmdldD0iI21vZGFsU2hvdyIKICAgIGRhdGEtYmFja2Ryb3A9InN0YXRpYyIgZGF0YS1rZXlib2FyZD0iZmFsc2UiPjwvYnV0dG9uPgogIDxkaXYgY2xhc3M9ImNvbnRlbnQiPgogICAgPHNlY3Rpb24gY2xhc3M9ImNvbW1vbi1ib3ggIj4KICAgICAgPGRpdiBjbGFzcz0iY29udGFpbmVyIj4KICAgICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgICAgPGRpdiBjbGFzcz0iY29sLW1kLTEyIGNvbC1zbS0xMiI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibW9kYWwgZmFkZSBwcm9kdWN0LWxpc3QtcG9wdXAiIGlkPSJtb2RhbFNob3ciIHRhYmluZGV4PSItMSIgcm9sZT0iZGlhbG9nIiBhcmlhLWhpZGRlbj0iZmFsc2UiPgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibW9kYWwtZGlhbG9nIG1vZGFsLWRpYWxvZy1jZW50ZXJlZCIgcm9sZT0iZG9jdW1lbnQiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJtb2RhbC1jb250ZW50Ij4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJtb2RhbC1ib2R5Ij4KICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImNvbnRlbnQiPgogICAgICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz0iY29tbW9uLWJveCAiPgogICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJzZWN0aW9uLXRpdGxlIGNlbnRlci1hbGlnbiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5Mb2cgaW4gd2l0aCB5b3VyIEdyb3cgSUQ8L2gyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJyb3cgZGl2LWNvbnRlbnQtY2VudGVyIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iY29sLW1kLTEyIGNvbC1zbS0xMiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGZvcm0gbWV0aG9kPSJQT1NUIiBpZD0ibG9naW5Gb3JtIiBhY3Rpb249Ii9wbGF5ZXIvZ3Jvd2lkL2xvZ2luL3ZhbGlkYXRlIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0LWNoYXJzZXQ9IlVURi04IiBjbGFzcz0iIiByb2xlPSJmb3JtIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgbmFtZT0iX3Rva2VuIiB0eXBlPSJoaWRkZW4iIHZhbHVlPSJ7eyBkYXRhIH19Ij4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9ImxvZ2luLW5hbWUiIGNsYXNzPSJmb3JtLWNvbnRyb2wgZ3Jvdy10ZXh0IiByZXF1aXJlZD0icmVxdWlyZWQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9IllvdXIgR3Jvd3RvcGlhIE5hbWUgKiIgbmFtZT0iZ3Jvd0lkIiB2YWx1ZT0iIiB0eXBlPSJ0ZXh0IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm49IltBLVphLXowLTldKyIgdGl0bGU9Ik9ubHkgbGV0dGVycyBhbmQgbnVtYmVycyBhcmUgYWxsb3dlZCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9InBhc3N3b3JkIiBjbGFzcz0iZm9ybS1jb250cm9sIGdyb3ctdGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSJZb3VyIEdyb3d0b3BpYSBQYXNzd29yZCAqIiBuYW1lPSJwYXNzd29yZCIgdHlwZT0icGFzc3dvcmQiIHZhbHVlPSIiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybj0iW0EtWmEtejAtOUAuXyFcLV0rIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPSJPbmx5IGxldHRlcnMsIG51bWJlcnMsIGFuZCBAIC4gXyAhIC0gYXJlIGFsbG93ZWQiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmb3JtLWdyb3VwIHRleHQtY2VudGVyIGZvcmdvdC1wYXNzd29yZCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9Imh0dHBzOi8vd3d3Lmdyb3d0b3BpYWdhbWUuY29tL2FjY291bnQiIHRhcmdldD0iX2JsYW5rIj5Gb3Jnb3QgUGFzc3dvcmQ8L2E+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxicj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0iIyIgaWQ9InRvZ2dsZVJlZ2lzdGVyIiBzdHlsZT0ibWFyZ2luLXRvcDogNXB4OyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7Ij5SZWdpc3RlciBBY2NvdW50PC9hPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmb3JtLWdyb3VwIHRleHQtY2VudGVyIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPSJidG4gYnRuLWxnIGJ0bi1wcmltYXJ5IGdyb3ctYnV0dG9uIiB0eXBlPSJzdWJtaXQiIHZhbHVlPSJMb2cgaW4iPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9mb3JtPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxmb3JtIG1ldGhvZD0iUE9TVCIgaWQ9InJlZ2lzdGVyRm9ybSIgYWN0aW9uPSIvcGxheWVyL2dyb3dpZC9sb2dpbi92YWxpZGF0ZSIgYWNjZXB0LWNoYXJzZXQ9IlVURi04IiBjbGFzcz0iaGlkZGVuIiByb2xlPSJmb3JtIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgbmFtZT0iX3Rva2VuIiB0eXBlPSJoaWRkZW4iIHZhbHVlPSJ7eyBkYXRhIH19Ij4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9InJlZ2lzdGVyLW5hbWUiIGNsYXNzPSJmb3JtLWNvbnRyb2wgZ3Jvdy10ZXh0IiByZXF1aXJlZD0icmVxdWlyZWQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9IllvdXIgR3Jvd3RvcGlhIE5hbWUgKiIgbmFtZT0iZ3Jvd0lkIiB2YWx1ZT0iIiB0eXBlPSJ0ZXh0IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm49IltBLVphLXowLTldKyIgdGl0bGU9Ik9ubHkgbGV0dGVycyBhbmQgbnVtYmVycyBhcmUgYWxsb3dlZCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9InJlZ2lzdGVyLWVtYWlsIiBjbGFzcz0iZm9ybS1jb250cm9sIGdyb3ctdGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSJZb3VyIEVtYWlsICoiIG5hbWU9ImVtYWlsIiB2YWx1ZT0iIiB0eXBlPSJlbWFpbCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9InJlZ2lzdGVyLXBhc3N3b3JkIiBjbGFzcz0iZm9ybS1jb250cm9sIGdyb3ctdGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSJZb3VyIEdyb3d0b3BpYSBQYXNzd29yZCAqIiBuYW1lPSJwYXNzd29yZCIgdHlwZT0icGFzc3dvcmQiIHZhbHVlPSIiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybj0iW0EtWmEtejAtOUAuXyFcLV0rIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPSJPbmx5IGxldHRlcnMsIG51bWJlcnMsIGFuZCBAIC4gXyAhIC0gYXJlIGFsbG93ZWQiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmb3JtLWdyb3VwIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGlkPSJyZWdpc3Rlci1jb25maXJtLXBhc3N3b3JkIiBjbGFzcz0iZm9ybS1jb250cm9sIGdyb3ctdGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSJDb25maXJtIFBhc3N3b3JkICoiIG5hbWU9InBhc3N3b3JkX2NvbmZpcm1hdGlvbiIgdHlwZT0icGFzc3dvcmQiIHZhbHVlPSIiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybj0iW0EtWmEtejAtOUAuXyFcLV0rIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPSJPbmx5IGxldHRlcnMsIG51bWJlcnMsIGFuZCBAIC4gXyAhIC0gYXJlIGFsbG93ZWQiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmb3JtLWdyb3VwIHRleHQtY2VudGVyIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0iIyIgaWQ9InRvZ2dsZUxvZ2luIiBzdHlsZT0ibWFyZ2luLWJvdHRvbTogMTBweDsgZGlzcGxheTogaW5saW5lLWJsb2NrOyI+QmFjayB0byBMb2dpbjwvYT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZm9ybS1ncm91cCB0ZXh0LWNlbnRlciI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzcz0iYnRuIGJ0bi1sZyBidG4tcHJpbWFyeSBncm93LWJ1dHRvbiIgdHlwZT0ic3VibWl0IiB2YWx1ZT0iUmVnaXN0ZXIiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9mb3JtPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+CiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgIDxzdHlsZT4KICAgICAgICAgICAgICAgICAgICAgICAgLmhpZGRlbiB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OwogICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICA8L3N0eWxlPgogICAgICAgICAgICAgICAgICAgICAgPHNjcmlwdD4KICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2dpbkZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Gb3JtJyk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVnaXN0ZXJGb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZ2lzdGVyRm9ybScpOwogICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvZ2dsZVJlZ2lzdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZ2dsZVJlZ2lzdGVyJyk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9nZ2xlTG9naW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9nZ2xlTG9naW4nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWN0aW9uVGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VjdGlvbi10aXRsZSBoMicpOwoKICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAbm90ZSB0b2dnbGUgdG8gcmVnaXN0ZXIgZm9ybQogICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZVJlZ2lzdGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luRm9ybS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyRm9ybS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS50ZXh0Q29udGVudCA9ICdSZWdpc3RlciB5b3VyIEdyb3cgSUQnOwogICAgICAgICAgICAgICAgICAgICAgICAgIH0pOwoKICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAbm90ZSB0b2dnbGUgdG8gbG9naW4gZm9ybQogICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZUxvZ2luLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyRm9ybS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luRm9ybS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS50ZXh0Q29udGVudCA9ICdMb2cgaW4gd2l0aCB5b3VyIEdyb3cgSUQnOwogICAgICAgICAgICAgICAgICAgICAgICAgIH0pOwoKICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAbm90ZSBsb2dpbiBmb3JtIGhhbmRsZXJzCiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9naW5TdWJtaXRCdXR0b24gPSBsb2dpbkZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT0ic3VibWl0Il0nKTsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2dpbk5hbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbi1uYW1lJyk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFzc3dvcmRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZCcpOwoKICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dpbk5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uIChlKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy52YWx1ZS5yZXBsYWNlKC9bXkEtWmEtejAtOV0vZywgJycpOwogICAgICAgICAgICAgICAgICAgICAgICAgIH0pOwoKICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24gKGUpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnJlcGxhY2UoL1teQS1aYS16MC05QC5fIVwtXS9nLCAnJyk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7CgogICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luRm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvZ2luU3VibWl0QnV0dG9uLmRpc2FibGVkKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9naW5TdWJtaXRCdXR0b24uZGlzYWJsZWQgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9naW5TdWJtaXRCdXR0b24udmFsdWUgPSAnTG9nZ2luZyBpbi4uLic7CiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7CgogICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEBub3RlIHJlZ2lzdGVyIGZvcm0gaGFuZGxlcnMKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWdpc3RlclN1Ym1pdEJ1dHRvbiA9IHJlZ2lzdGVyRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPSJzdWJtaXQiXScpOwogICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZ2lzdGVyTmFtZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZ2lzdGVyLW5hbWUnKTsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWdpc3RlckVtYWlsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVnaXN0ZXItZW1haWwnKTsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWdpc3RlclBhc3N3b3JkSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVnaXN0ZXItcGFzc3dvcmQnKTsKICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWdpc3RlckNvbmZpcm1QYXNzd29yZElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZ2lzdGVyLWNvbmZpcm0tcGFzc3dvcmQnKTsKCiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJOYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBmdW5jdGlvbiAoZSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUucmVwbGFjZSgvW15BLVphLXowLTldL2csICcnKTsKICAgICAgICAgICAgICAgICAgICAgICAgICB9KTsKCiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJQYXNzd29yZElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24gKGUpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnJlcGxhY2UoL1teQS1aYS16MC05QC5fIVwtXS9nLCAnJyk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7CgogICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyQ29uZmlybVBhc3N3b3JkSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBmdW5jdGlvbiAoZSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUucmVwbGFjZSgvW15BLVphLXowLTlALl8hXC1dL2csICcnKTsKICAgICAgICAgICAgICAgICAgICAgICAgICB9KTsKCiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVnaXN0ZXJTdWJtaXRCdXR0b24uZGlzYWJsZWQpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CgogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2lzdGVyUGFzc3dvcmRJbnB1dC52YWx1ZSAhPT0gcmVnaXN0ZXJDb25maXJtUGFzc3dvcmRJbnB1dC52YWx1ZSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdQYXNzd29yZHMgZG8gbm90IG1hdGNoIScpOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CgogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJTdWJtaXRCdXR0b24uZGlzYWJsZWQgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJTdWJtaXRCdXR0b24udmFsdWUgPSAnUmVnaXN0ZXJpbmcuLi4nOwogICAgICAgICAgICAgICAgICAgICAgICAgIH0pOwogICAgICAgICAgICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgICAgICAgICAgIDwvc2NyaXB0PgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvc2VjdGlvbj4KICA8L2Rpdj4KPC9ib2R5Pgo8IS0tIEpRVUVSWSBMSUJSQVJZIC0tPgo8c2NyaXB0CiAgc3JjPSJodHRwczovL3MzLmV1LXdlc3QtMS5hbWF6b25hd3MuY29tL2Nkbi5ncm93dG9waWFnYW1lLmNvbS93ZWJzaXRlL3Jlc291cmNlcy9hc3NldHMvanMvanF1ZXJ5LTMuNy4xLm1pbi5qcyI+PC9zY3JpcHQ+CjwhLS0gYm9vc3RyYXAgamF2YXNjcmlwdCAtLT4KPHNjcmlwdAogIHNyYz0iaHR0cHM6Ly9zMy5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbS9jZG4uZ3Jvd3RvcGlhZ2FtZS5jb20vd2Vic2l0ZS9yZXNvdXJjZXMvYXNzZXRzL2pzL2Jvb3RzdHJhcDMubWluLmpzIj48L3NjcmlwdD4KPHNjcmlwdD4KICBsZXQgY2xpY2tlZCA9IGZhbHNlOwogICQoImEiKS5jbGljayhmdW5jdGlvbiAoKSB7IGlmIChjbGlja2VkID09PSBmYWxzZSkgeyBjbGlja2VkID0gdHJ1ZTsgcmV0dXJuIHRydWU7IH0gJCh0aGlzKS5hdHRyKCJvbmNsaWNrIiwgInJldHVybiBmYWxzZTsiKTsgfSk7CiAgJCgnZG9jdW1lbnQnKS5yZWFkeShmdW5jdGlvbiAoKSB7CiAgICBkb2N1bWVudC5vbmtleWRvd24gPSAoZSkgPT4gewogICAgICBpZiAoZS5rZXkgPT0gMTIzKSB7CiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgICB9CiAgICAgIGlmIChlLmtleSA9PSAnRjEyJykgewogICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgfQogICAgICBpZiAoZS5jdHJsS2V5ICYmIGUuc2hpZnRLZXkgJiYgZS5rZXkgPT0gJ0knKSB7CiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgICB9CiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5rZXkgPT0gJ0knKSB7CiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgICB9CiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5zaGlmdEtleSAmJiBlLmtleSA9PSAnQycpIHsKICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7CiAgICAgIH0KICAgICAgaWYgKGUuY3RybEtleSAmJiBlLnNoaWZ0S2V5ICYmIGUua2V5ID09ICdKJykgewogICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgfQogICAgICBpZiAoZS5jdHJsS2V5ICYmIGUua2V5ID09ICdVJykgewogICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgfQogICAgfTsKICAgICQoJyNtb2RhbEJ1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJyk7CiAgICAkKCcuY2xvc2UnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7CiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICJodHRwczovL2xvZ2luLmdyb3d0b3BpYWdhbWUuY29tL3BsYXllci92YWxpZGF0ZS9jbG9zZSIKICAgIH0pOwogICAgLy8gJCgnZm9ybScpLnN1Ym1pdCgkKCdmb3JtIC5ncm93LWJ1dHRvbicpLmF0dHIoJ2Rpc2FibGVkJywgJ3RydWUnKSk7CgogICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKG11dGF0aW9ucykgewogICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAobXV0YXRpb24pIHsKICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uLmFkZGVkTm9kZXMubGVuZ3RoOyBpKyspIHsKICAgICAgICAgIGlmIChtdXRhdGlvbi5hZGRlZE5vZGVzW2ldLnRhZ05hbWUgPT0gJ0RJVicpIHsKICAgICAgICAgICAgdmFyIHRoZWRpdiA9IG11dGF0aW9uLmFkZGVkTm9kZXNbaV07CiAgICAgICAgICAgIHZhciBzdyA9IHdpbmRvdy5zY3JlZW4ud2lkdGg7CiAgICAgICAgICAgIGlmIChzdyA8IDY2NykgewogICAgICAgICAgICAgICQodGhlZGl2KS5jc3MoewogICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6ICdzY2FsZSgwLjc1KScsCiAgICAgICAgICAgICAgICAndHJhbnNmb3JtLW9yaWdpbic6ICcwIDAnLAogICAgICAgICAgICAgICAgJy13ZWJraXQtdHJhbnNmb3JtJzogJ3NjYWxlKDAuNzUpJywKICAgICAgICAgICAgICAgICctd2Via2l0LXRyYW5zZm9ybS1vcmlnaW4nOiAnMCAwJywKICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdhdXRvJwogICAgICAgICAgICAgIH0pOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9KTsKICAgIH0pOwogICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlIH0pOwogIH0pOwo8L3NjcmlwdD4KCjwvaHRtbD4=";


// @note trust proxy - set to number of proxies in front of app
app.set('trust proxy', 1);

// @note middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// @note rate limiter - 50 requests per minute
const limiter = rateLimit({
  windowMs: 60_000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use(limiter);

// @note static files from public folder
app.use(express.static(path.join(process.cwd(), 'public')));

// @note request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  console.log(
    `[REQ] ${req.method} ${req.path} → ${clientIp} | ${_res.statusCode}`,
  );
  next();
});

// @note root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, world!');
});

/**
 * @note dashboard endpoint - serves login HTML page with client data
 * @param req - express request with optional body data
 * @param res - express response
 */
app.all('/player/login/dashboard', async (req: Request, res: Response) => {
  const body = req.body;
  let clientData = '';

  // @note body comes as { "key1|val1\nkey2|val2\n...": "" }
  // @note the actual data is in the first key, pipe-delimited with \n separators
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    clientData = Object.keys(body)[0];
  }

  // @note convert clientData to base64 string without JSON quotes
  const encodedClientData = Buffer.from(clientData).toString('base64');

  // @note read dashboard template and replace placeholder
  const templatePath = path.join(process.cwd(), 'template', 'dashboard.html');

  let templateContent = '';
  try {
    if (fs.existsSync(templatePath)) {
      templateContent = fs.readFileSync(templatePath, 'utf-8');
    }
  } catch (err) {
    console.log('[WARN] Template read failed, using embedded fallback:', err);
  }
  if (!templateContent) {
    templateContent = Buffer.from(EMBEDDED_DASHBOARD_HTML_BASE64, 'base64').toString('utf-8');
  }
  const htmlContent = templateContent.replace('{{ data }}', encodedClientData);

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

/**
 * @note validate login endpoint - validates GrowID credentials
 * @param req - express request with growId, password, _token
 * @param res - express response with token
 */
app.all(
  '/player/growid/login/validate',
  async (req: Request, res: Response) => {
    try {
      const formData = req.body as Record<string, string>;
      const _token = formData._token;
      const growId = formData.growId;
      const password = formData.password;
      const email = formData.email;

      let token = '';
      if (email) {
        token = Buffer.from(
          `_token=${_token}&growId=${growId}&password=${password}&email=${email}&reg=1`,
        ).toString('base64');
      } else {
        token = Buffer.from(
          `_token=${_token}&growId=${growId}&password=${password}&reg=0`,
        ).toString('base64');
      }

      res.send(
        JSON.stringify({
          status: 'success',
          message: 'Account Validated.',
          token,
          url: '',
          accountType: 'growtopia',
        }),
      );
    } catch (error) {
      console.log(`[ERROR]: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
  },
);

/**
 * @note first checktoken endpoint - redirects to validate endpoint
 * @param req - express request with refreshToken and clientData
 * @param res - express response with updated token
 */
app.all('/player/growid/checktoken', async (_req: Request, res: Response) => {
  return res.redirect(307, '/player/growid/validate/checktoken');
});

/**
 * @note second checktoken endpoint - validates token and returns updated token
 * @param req - express request with refreshToken and clientData
 * @param res - express response with updated token
 */
app.all(
  '/player/growid/validate/checktoken',
  async (req: Request, res: Response) => {
    try {
      let refreshToken: string | undefined;
      let clientData: string | undefined;
      let source = 'empty';
      const contentType = req.headers['content-type'] || '';

      if (typeof req.body === 'object' && req.body !== null) {
        const formData = req.body as Record<string, string>;

        if ('refreshToken' in formData || 'clientData' in formData) {
          refreshToken = formData.refreshToken;
          clientData = formData.clientData;
          source = contentType.includes('application/json')
            ? 'json/object'
            : 'form-urlencoded';
        } else if (Object.keys(formData).length === 1) {
          const rawPayload = Object.keys(formData)[0];
          const params = new URLSearchParams(rawPayload);
          refreshToken = params.get('refreshToken') || undefined;
          clientData = params.get('clientData') || undefined;
          if (refreshToken || clientData) {
            source = 'single-key-form-payload';
          }
        }
      } else if (typeof req.body === 'string' && req.body.length > 0) {
        const params = new URLSearchParams(req.body);
        refreshToken = params.get('refreshToken') || undefined;
        clientData = params.get('clientData') || undefined;
        source = 'string/body-parser';
      }

      if (
        (!refreshToken || !clientData) &&
        req.readable &&
        !req.readableEnded
      ) {
        const rawBody = await new Promise<string>((resolve, reject) => {
          let rawPayload = '';

          req.on('data', (chunk: Buffer | string) => {
            rawPayload += chunk.toString();
          });
          req.on('end', () => resolve(rawPayload));
          req.on('error', reject);
        });

        if (rawBody) {
          const params = new URLSearchParams(rawBody);
          refreshToken = params.get('refreshToken') || refreshToken;
          clientData = params.get('clientData') || clientData;
          if (refreshToken || clientData) {
            source = 'raw-stream';
          }
        }
      }

      console.log(`[CHECKTOKEN] Parsed as ${source}`);

      if (!refreshToken || !clientData) {
        console.log(`[ERROR]: Missing refreshToken or clientData`);
        res.status(200).json({
          status: 'error',
          message: 'Missing refreshToken or clientData',
        });
        return;
      }

      let decodedRefreshToken = Buffer.from(refreshToken, 'base64').toString(
        'utf-8',
      );

      // @note remove &reg=0/1 from decodedRefreshToken if available
      if (decodedRefreshToken.includes('&reg=0')) {
        decodedRefreshToken = decodedRefreshToken.replace('&reg=0', '');
      } else if (decodedRefreshToken.includes('&reg=1')) {
        decodedRefreshToken = decodedRefreshToken.replace('&reg=1', '');
      }

      const token = Buffer.from(
        decodedRefreshToken.replace(
          /(_token=)[^&]*/,
          `$1${Buffer.from(clientData).toString('base64')}`,
        ),
      ).toString('base64');

      res.send(
        JSON.stringify({
          status: 'success',
          message: 'Account Validated.',
          token,
          url: '',
          accountType: 'growtopia',
          accountAge: 2,
        }),
      );
    } catch (error) {
      console.log(`[ERROR]: ${error}`);
      res.status(200).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});

export default app;
