import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
export const SearchInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <Input
    placeholder="Search contributions..."
    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
    value={value}
    onChange={onChange}
    style={{
      width: '300px',
      borderRadius: '8px',
      height: '32px',
    }}
    allowClear
  />
);
